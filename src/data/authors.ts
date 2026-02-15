import { getCollection, getEntry } from "astro:content";

export async function getAuthorBySlug(slug: string) {
  const entry = await getEntry("authors", slug);
  return entry ? { slug: entry.id, ...entry.data } : undefined;
}

export async function getAllAuthors() {
  const entries = await getCollection("authors");
  return entries.map((e) => ({ slug: e.id, ...e.data }));
}

export type Author = Awaited<ReturnType<typeof getAuthorBySlug>> & {};
