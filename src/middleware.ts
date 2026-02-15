import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const host = context.request.headers.get("host") || "";
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Determine if this is the OTR subdomain request
  const isOTR = host.startsWith("otr.");

  context.locals.isColumns = isOTR;

  if (isOTR) {
    // Skip rewrite for static assets, API routes, and paths already under /otr
    if (
      pathname.startsWith("/otr") ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_astro/") ||
      pathname.startsWith("/fonts/") ||
      pathname.startsWith("/columnists/") ||
      pathname.match(/\.\w+$/) // static files with extensions
    ) {
      return next();
    }

    // Rewrite: /posts/foo → /otr/posts/foo
    const rewrittenPath = `/otr${pathname === "/" ? "/" : pathname}`;
    return context.rewrite(rewrittenPath);
  }

  return next();
});
