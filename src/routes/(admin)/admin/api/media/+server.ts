import { json, error } from '@sveltejs/kit';
import { isAppError } from '$lib/server/errors';
import * as mediaService from '$lib/server/services/media.service';
import type { RequestHandler } from './$types';

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
