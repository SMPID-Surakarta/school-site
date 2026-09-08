import * as publicService from '$lib/server/services/public.service';
import type { RequestHandler } from './$types';

const STATIC_PATHS = [
	'/',
	'/berita',
	'/guru',
	'/prestasi',
	'/galeri',
	'/agenda',
	'/unduhan',
	'/faq',
	'/kontak'
];

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
	const [posts, pages] = await Promise.all([
		publicService.getFeedPosts(),
		publicService.listPublishedPages()
	]);

	const urls: { loc: string; lastmod?: string }[] = [
		...STATIC_PATHS.map((p) => ({ loc: `${origin}${p}` })),
		...posts.map((p) => ({
			loc: `${origin}/berita/${p.slug}`,
			lastmod: (p.updatedAt ?? p.publishedAt ?? new Date()).toISOString()
		})),
		...pages.map((p) => ({ loc: `${origin}/${p.slug}` }))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) =>
			`  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
