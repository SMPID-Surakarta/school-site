import { json, error } from '@sveltejs/kit';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import * as mediaService from '$lib/server/services/media.service';
import type { RequestHandler } from './$types';

/**
 * List media endpoint for media picker and library selection.
 * Query params:
 * - `kind`: 'image' | 'file'
 * - `q`: search keyword
 */
export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	if (!session?.user) throw error(401, 'Unauthorized');

	const user = session.user;
	const actor = { id: user.id, role: user.role as Role };

	if (!can(actor.role, 'read', 'media')) throw error(403, 'Akses ditolak');

	const kind = event.url.searchParams.get('kind');
	const search = event.url.searchParams.get('q')?.toLowerCase().trim();

	const items = await mediaService.listMedia(actor, { all: true, limit: 100 });

	let filtered = items;
	if (kind === 'image') {
		filtered = filtered.filter((m) => m.mime.startsWith('image/'));
	} else if (kind === 'file') {
		filtered = filtered.filter((m) => !m.mime.startsWith('image/'));
	}

	if (search) {
		filtered = filtered.filter(
			(m) =>
				m.originalName.toLowerCase().includes(search) ||
				(m.altText && m.altText.toLowerCase().includes(search))
		);
	}

	return json(
		filtered.map((m) => ({
			id: m.id,
			url: m.url,
			originalName: m.originalName,
			mime: m.mime,
			size: m.size,
			width: m.width,
			height: m.height,
			altText: m.altText,
			createdAt: m.createdAt
		}))
	);
};

/**
 * Media upload endpoint (multipart/form-data). Guarded by the admin session in
 * hooks.server.ts; per-role permission is enforced in the media service.
 * Field `file` is required; `kind` = 'image' (default) | 'file'; `altText` optional.
 */
export const POST: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	const form = await event.request.formData();
	const file = form.get('file');
	const kind = form.get('kind');
	const altText = form.get('altText');

	if (!(file instanceof File)) {
		throw error(400, 'Berkas tidak ditemukan');
	}

	try {
		const media =
			kind === 'file'
				? await mediaService.uploadFile(actor, file)
				: await mediaService.uploadImage(
						actor,
						file,
						typeof altText === 'string' ? altText : undefined
					);

		return json({
			id: media.id,
			url: media.url,
			altText: media.altText,
			width: media.width,
			height: media.height
		});
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		console.error('Unexpected media upload failure', err);
		throw error(500, 'Gagal mengunggah media');
	}
};

/** Delete a media object (and its R2 file). Query: `?id=<uuid>`. */
export const DELETE: RequestHandler = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	const id = event.url.searchParams.get('id');
	if (!id) throw error(400, 'ID tidak valid');

	try {
		await mediaService.deleteMedia(actor, id);
		return json({ ok: true });
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal menghapus media');
	}
};
