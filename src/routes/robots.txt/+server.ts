import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /search

Sitemap: ${url.origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=86400'
		}
	});
};
