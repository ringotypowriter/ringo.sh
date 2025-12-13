import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

function escapeXml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toCdata(input: string): string {
  return `<![CDATA[${input.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL('https://ringo.sh');
  const feedUrl = new URL('/rss.xml', baseUrl).toString();

  const allSnippets = await getCollection('snippets');
  const snippets = allSnippets
    .filter((s) => !s.data.wip)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 50);

  const items = snippets
    .map((s) => {
      const title = escapeXml(s.data.title);
      const link = new URL(`/snippets/${s.id}`, baseUrl).toString();
      const guid = link;
      const pubDate = s.data.date.toUTCString();
      const description = escapeXml(s.data.description ?? '');
      const html = s.rendered?.html ?? '';

      return [
        '    <item>',
        `      <title>${title}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${guid}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${description}</description>`,
        `      <content:encoded>${toCdata(html)}</content:encoded>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '  xmlns:atom="http://www.w3.org/2005/Atom"',
    '  xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    '    <title>ringo.sh</title>',
    '    <description>RingoTypowriter&apos;s snippets</description>',
    `    <link>${baseUrl.toString()}</link>`,
    '    <language>en</language>',
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    '    <generator>Astro</generator>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
