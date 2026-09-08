import * as publicService from '$lib/server/services/public.service';
import { htmlToPlainText } from '$lib/server/html';
import { DEFAULT_SITE_NAME } from '$lib/seo';
import type { RequestHandler } from './$types';

function xmlEscape(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const [settings, posts] = await Promise.all([
		publicService.getSiteSettings(),
		publicService.getFeedPosts()
	]);

	const siteName = settings?.schoolName || DEFAULT_SITE_NAME;
	const description = settings?.description ?? `Berita terbaru dari ${siteName}`;

	const items = posts
		.slice(0, 30)
		.map((p) => {
			const link = `${origin}/berita/${p.slug}`;
			const pubDate = (p.publishedAt ?? p.updatedAt ?? new Date()).toUTCString();
			const summary = htmlToPlainText(p.content).slice(0, 300);
			return `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid>${xmlEscape(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${xmlEscape(summary)}</description>
    </item>`;
		})
		.join('\n');

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(siteName)}</title>
    <link>${xmlEscape(origin)}</link>
    <description>${xmlEscape(description)}</description>
    <language>id</language>
${items}
  </channel>
</rss>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
