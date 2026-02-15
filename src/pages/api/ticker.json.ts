import type { APIRoute } from "astro";

type TickerItem = {
  category: "sports" | "markets";
  label: string;
  value: string;
  change?: number;
  href?: string;
};

type TickerResponse = {
  updatedAt: string;
  items: TickerItem[];
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

// Cache TTLs in milliseconds - tuned for free tier limits
const CACHE_TTL = {
  forex: 30 * 60 * 1000, // 30 min (ExchangeRate-API: 1,500/month = ~48/day max)
  stocks: 60 * 60 * 1000, // 1 hour (AlphaVantage: 25/day)
  crypto: 10 * 60 * 1000, // 10 min
  gold: 30 * 60 * 1000, // 30 min
  sports: 2 * 60 * 1000, // 2 min (only during live games)
  response: 60 * 1000, // 1 min for assembled response
};

// In-memory fallback cache (for local dev or KV unavailable)
const memoryCache = new Map<string, CacheEntry<unknown>>();

type RuntimeEnv = {
  REALTIME_SPORTS_API_KEY?: string;
  API_FOOTBALL_KEY?: string;
  ALPHAVANTAGE_KEY?: string;
  EXCHANGERATE_API_KEY?: string;
  TICKER_CACHE?: KVNamespace;
};

const getRuntimeEnv = (context: Parameters<APIRoute>[0]) =>
<<<<<<< HEAD
  (context.locals as { runtime?: { env?: RuntimeEnv } } | undefined)?.runtime
    ?.env;
=======
  (context.locals as { runtime?: { env?: RuntimeEnv } } | undefined)?.runtime?.env;
>>>>>>> a27efa5 (fix: audit critical issues — dead code, a11y, and security)

const getEnv = (context: Parameters<APIRoute>[0]) => {
  const runtimeEnv = getRuntimeEnv(context);
  return {
    REALTIME_SPORTS_API_KEY: runtimeEnv?.REALTIME_SPORTS_API_KEY,
    API_FOOTBALL_KEY: runtimeEnv?.API_FOOTBALL_KEY,
    ALPHAVANTAGE_KEY: runtimeEnv?.ALPHAVANTAGE_KEY,
    EXCHANGERATE_API_KEY: runtimeEnv?.EXCHANGERATE_API_KEY,
    TICKER_CACHE: runtimeEnv?.TICKER_CACHE,
  };
};

async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  kv?: KVNamespace,
): Promise<T | null> {
  const now = Date.now();

  // Try KV first (persistent across worker invocations)
  if (kv) {
    try {
      const cached = (await kv.get(key, "json")) as CacheEntry<T> | null;
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }
    } catch {
      // KV read failed, continue to fetch
    }
  }

  // Try memory cache (fallback for local dev)
  const memoryCached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memoryCached && memoryCached.expiresAt > now) {
    return memoryCached.data;
  }

  // Fetch fresh data
  try {
    const data = await fetcher();
    const entry: CacheEntry<T> = { data, expiresAt: now + ttl };

    // Store in KV
    if (kv) {
      try {
        await kv.put(key, JSON.stringify(entry), {
          expirationTtl: Math.ceil(ttl / 1000) + 60,
        });
      } catch {
        // KV write failed, continue
      }
    }

    // Store in memory
    memoryCache.set(key, entry);

    return data;
  } catch {
    return null;
  }
}

const fetchJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
};

const normalizeText = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const formatScore = (homeScore: number | null, awayScore: number | null) => {
  if (homeScore === null || awayScore === null) return "";
  return `${homeScore}-${awayScore}`;
};

const formatChange = (current: number, previous: number | null) => {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const getRealtimeEvents = (
  payload: unknown,
  leagueLabel: string,
): TickerItem[] => {
  const data = payload as Record<string, unknown>;
  const events: unknown[] =
    (data?.data as unknown[]) ||
    (data?.events as unknown[]) ||
    (data?.response as unknown[]) ||
    [];

  return events
    .map((event) => {
      const e = event as Record<string, unknown>;
      const home =
        normalizeText((e?.home_team as Record<string, unknown>)?.name) ||
        normalizeText((e?.homeTeam as Record<string, unknown>)?.name) ||
        normalizeText((e?.home as Record<string, unknown>)?.name) ||
        normalizeText(
          (e?.teams as Record<string, unknown>)?.home as Record<
            string,
            unknown
          >,
        ) ||
        normalizeText(e?.home_team) ||
        normalizeText(e?.home);
      const away =
        normalizeText((e?.away_team as Record<string, unknown>)?.name) ||
        normalizeText((e?.awayTeam as Record<string, unknown>)?.name) ||
        normalizeText((e?.away as Record<string, unknown>)?.name) ||
        normalizeText(
          (e?.teams as Record<string, unknown>)?.away as Record<
            string,
            unknown
          >,
        ) ||
        normalizeText(e?.away_team) ||
        normalizeText(e?.away);
      if (!home || !away) return null;

      const scores = e?.scores as Record<string, unknown>;
      const score = e?.score as Record<string, unknown>;
      const goals = e?.goals as Record<string, unknown>;
      const homeScore =
        toNumber(scores?.home) ??
        toNumber(score?.home) ??
        toNumber(goals?.home) ??
        toNumber(e?.home_score) ??
        toNumber(e?.homeScore);
      const awayScore =
        toNumber(scores?.away) ??
        toNumber(score?.away) ??
        toNumber(goals?.away) ??
        toNumber(e?.away_score) ??
        toNumber(e?.awayScore);

      const statusObj = e?.status as Record<string, unknown>;
      const stateObj = e?.state as Record<string, unknown>;
      const status =
        normalizeText(statusObj?.short) ||
        normalizeText(statusObj?.description) ||
        normalizeText(e?.status) ||
        normalizeText(stateObj?.short) ||
        normalizeText(e?.state);

      const time =
        normalizeText(statusObj?.clock) ||
        normalizeText(e?.clock) ||
        normalizeText(e?.time) ||
        normalizeText(e?.minute);

      const scoreText = formatScore(homeScore, awayScore);
      const statusText = [scoreText, time || status]
        .filter(Boolean)
        .join(" • ");

      return {
        category: "sports" as const,
        label: `${leagueLabel}: ${away} @ ${home}`,
        value: statusText || "Live",
      };
    })
    .filter(Boolean) as TickerItem[];
};

const getApiFootballEvents = (payload: unknown): TickerItem[] => {
  const data = payload as Record<string, unknown>;
  const events: unknown[] = (data?.response as unknown[]) || [];
  return events
    .map((event) => {
      const e = event as Record<string, unknown>;
      const teams = e?.teams as Record<string, unknown>;
      const home = normalizeText(
        (teams?.home as Record<string, unknown>)?.name,
      );
      const away = normalizeText(
        (teams?.away as Record<string, unknown>)?.name,
      );
      if (!home || !away) return null;

      const goals = e?.goals as Record<string, unknown>;
      const homeScore = toNumber(goals?.home);
      const awayScore = toNumber(goals?.away);
      const fixture = e?.fixture as Record<string, unknown>;
      const fixtureStatus = fixture?.status as Record<string, unknown>;
      const time =
        normalizeText(fixtureStatus?.elapsed) ||
        normalizeText(fixtureStatus?.short);

      const scoreText = formatScore(homeScore, awayScore);
      const statusText = [scoreText, time ? `${time}m` : ""]
        .filter(Boolean)
        .join(" • ");

      return {
        category: "sports" as const,
        label: `Soccer: ${away} @ ${home}`,
        value: statusText || "Live",
      };
    })
    .filter(Boolean) as TickerItem[];
};

const createFetchers = (env: ReturnType<typeof getEnv>) => ({
  async fetchSports(): Promise<TickerItem[]> {
    const items: TickerItem[] = [];

    if (env.REALTIME_SPORTS_API_KEY) {
      const headers = {
        Authorization: `Bearer ${env.REALTIME_SPORTS_API_KEY}`,
      };
      const [nflResult, nbaResult] = await Promise.allSettled([
        fetchJson(
          "https://www.realtimesportsapi.com/api/v1/sports/football/leagues/nfl/events/live",
          { headers },
        ),
        fetchJson(
          "https://www.realtimesportsapi.com/api/v1/sports/basketball/leagues/nba/events/live",
          { headers },
        ),
      ]);
      if (nflResult.status === "fulfilled")
        items.push(...getRealtimeEvents(nflResult.value, "NFL"));
      if (nbaResult.status === "fulfilled")
        items.push(...getRealtimeEvents(nbaResult.value, "NBA"));
    }

    if (env.API_FOOTBALL_KEY) {
      try {
        const payload = await fetchJson(
          "https://v3.football.api-sports.io/fixtures?live=all",
          {
            headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
          },
        );
        items.push(...getApiFootballEvents(payload));
      } catch {
        // Soccer fetch failed
      }
    }

    return items;
  },

  async fetchStocks(): Promise<TickerItem | null> {
    if (!env.ALPHAVANTAGE_KEY) return null;
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "TIME_SERIES_DAILY");
    url.searchParams.set("symbol", "SPY");
    url.searchParams.set("apikey", env.ALPHAVANTAGE_KEY);
    const payload = (await fetchJson(url.toString())) as Record<
      string,
      unknown
    >;
    const series = payload?.["Time Series (Daily)"] as Record<
      string,
      Record<string, unknown>
    >;
    if (!series) return null;
    const dates = Object.keys(series).sort().reverse();
    const latest = series?.[dates[0]];
    const previous = series?.[dates[1]];
    const close = toNumber(latest?.["4. close"]);
    const prevClose = toNumber(previous?.["4. close"]);
    if (close === null) return null;
    return {
      category: "markets",
      label: "S&P 500 (SPY)",
      value: `$${close.toFixed(2)}`,
      change: formatChange(close, prevClose) ?? undefined,
    };
  },

  async fetchNet(): Promise<TickerItem | null> {
    if (!env.ALPHAVANTAGE_KEY) return null;
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "TIME_SERIES_DAILY");
    url.searchParams.set("symbol", "NET");
    url.searchParams.set("apikey", env.ALPHAVANTAGE_KEY);
    const payload = (await fetchJson(url.toString())) as Record<
      string,
      unknown
    >;
    const series = payload?.["Time Series (Daily)"] as Record<
      string,
      Record<string, unknown>
    >;
    if (!series) return null;
    const dates = Object.keys(series).sort().reverse();
    const latest = series?.[dates[0]];
    const previous = series?.[dates[1]];
    const close = toNumber(latest?.["4. close"]);
    const prevClose = toNumber(previous?.["4. close"]);
    if (close === null) return null;
    return {
      category: "markets",
      label: "Cloudflare (NET)",
      value: `$${close.toFixed(2)}`,
      change: formatChange(close, prevClose) ?? undefined,
    };
  },

  async fetchCrypto(): Promise<TickerItem[]> {
    // CoinGecko free API - no key required
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
    const payload = (await fetchJson(url)) as Record<
      string,
      Record<string, number>
    >;
    const items: TickerItem[] = [];

    if (payload?.bitcoin) {
      items.push({
        category: "markets",
        label: "BTC",
        value: `$${payload.bitcoin.usd.toLocaleString()}`,
        change: payload.bitcoin.usd_24h_change,
      });
    }
    if (payload?.ethereum) {
      items.push({
        category: "markets",
        label: "ETH",
        value: `$${payload.ethereum.usd.toLocaleString()}`,
        change: payload.ethereum.usd_24h_change,
      });
    }
    if (payload?.solana) {
      items.push({
        category: "markets",
        label: "SOL",
        value: `$${payload.solana.usd.toFixed(2)}`,
        change: payload.solana.usd_24h_change,
      });
    }

    return items;
  },

  async fetchGold(): Promise<TickerItem | null> {
    const payload = (await fetchJson(
      "https://api.gold-api.com/price/XAU",
    )) as Record<string, unknown>;
    const price = toNumber(payload?.price);
    if (price === null) return null;
    return {
      category: "markets",
      label: "Gold (XAU)",
      value: `$${price.toFixed(2)}`,
    };
  },

  async fetchForex(): Promise<TickerItem[]> {
    if (!env.EXCHANGERATE_API_KEY) return [];
    const url = `https://v6.exchangerate-api.com/v6/${env.EXCHANGERATE_API_KEY}/latest/USD`;
    const payload = (await fetchJson(url)) as Record<string, unknown>;
    const rates = payload?.conversion_rates as Record<string, unknown>;
    if (!rates) return [];

    const items: TickerItem[] = [];
    const eurRate = toNumber(rates?.EUR);
    if (eurRate !== null)
      items.push({
        category: "markets",
        label: "USD/EUR",
        value: `€${eurRate.toFixed(4)}`,
      });
    const copRate = toNumber(rates?.COP);
    if (copRate !== null)
      items.push({
        category: "markets",
        label: "USD/COP",
        value: `$${copRate.toFixed(0)}`,
      });
    const gbpRate = toNumber(rates?.GBP);
    if (gbpRate !== null)
      items.push({
        category: "markets",
        label: "USD/GBP",
        value: `£${gbpRate.toFixed(4)}`,
      });
    return items;
  },
});

export const GET: APIRoute = async (context) => {
  const env = getEnv(context);
  const kv = env.TICKER_CACHE;
  const fetchers = createFetchers(env);

  // Check for cached full response first
  const cachedResponse = await getCached<TickerResponse>(
    "ticker:response",
    CACHE_TTL.response,
    async () => {
      throw new Error("skip");
    },
    kv,
  );
  if (cachedResponse) {
    return new Response(JSON.stringify(cachedResponse), {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=60",
      },
    });
  }

  // Fetch each data source with its own cache TTL
  const [sports, stocks, net, crypto, gold, forex] = await Promise.all([
    getCached("ticker:sports", CACHE_TTL.sports, fetchers.fetchSports, kv),
    getCached("ticker:stocks", CACHE_TTL.stocks, fetchers.fetchStocks, kv),
    getCached("ticker:stocks:net", CACHE_TTL.stocks, fetchers.fetchNet, kv),
    getCached("ticker:crypto", CACHE_TTL.crypto, fetchers.fetchCrypto, kv),
    getCached("ticker:gold", CACHE_TTL.gold, fetchers.fetchGold, kv),
    getCached("ticker:forex", CACHE_TTL.forex, fetchers.fetchForex, kv),
  ]);

  const items: TickerItem[] = [
    ...(sports ?? []).slice(0, 6),
    ...([stocks, net].filter(Boolean) as TickerItem[]),
    ...(crypto ?? []),
    ...([gold].filter(Boolean) as TickerItem[]),
    ...(forex ?? []),
  ];

  const data: TickerResponse = {
    updatedAt: new Date().toISOString(),
    items: items.length
      ? items
      : [{ category: "markets", label: "Ticker", value: "No data available" }],
  };

  // Cache the assembled response
  if (kv) {
    try {
      const entry: CacheEntry<TickerResponse> = {
        data,
        expiresAt: Date.now() + CACHE_TTL.response,
      };
      await kv.put("ticker:response", JSON.stringify(entry), {
        expirationTtl: 120,
      });
    } catch {
      // KV write failed
    }
  }
  memoryCache.set("ticker:response", {
    data,
    expiresAt: Date.now() + CACHE_TTL.response,
  });

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
    },
  });
};
