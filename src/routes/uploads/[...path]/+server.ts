import { error } from '@sveltejs/kit';
import { getObject } from '$lib/server/storage';
import type { RequestHandler } from './$types';

/**
 * Serves uploaded media from the local upload directory. Only keys that exist in the
 * `media` table are served (no directory listing / traversal). Keys are UUID-based, so
 * responses are safe to cache immutably.
 */
export const GET: RequestHandler = async ({ params }) => {
	const object = await getObject(params.path);
	if (!object) throw error(404, 'Berkas tidak ditemukan');

	return new Response(new Uint8Array(object.buffer), {
		headers: {
			'Content-Type': object.mime,
			'Content-Length': String(object.buffer.byteLength),
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
