import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? date.toISOString();
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = new URL("https://ringo.sh");

  const allSnippets = await getCollection("snippets");
  const snippets = allSnippets.filter((s) => !s.data.wip);

  const staticPages: Array<{ path: string; lastmod?: string }> = [
    { path: "/" },
    { path: "/snippets" },
    { path: "/projects" },
  ];

  const urls: Array<{ loc: string; lastmod?: string }> = [
    ...staticPages.map((p) => ({
      loc: new URL(p.path, baseUrl).toString(),
      lastmod: p.lastmod,
    })),
    ...snippets.map((s) => ({
      loc: new URL(`/snippets/${s.id}`, baseUrl).toString(),
      lastmod: toIsoDate(s.data.date),
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(({ loc, lastmod }) => {
        const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
        return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
