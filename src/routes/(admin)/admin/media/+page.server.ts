import { fail, error } from '@sveltejs/kit';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import * as mediaService from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	if (!can(user.role as Role, 'read', 'media')) throw error(403, 'Akses ditolak');

	return {
		media: await mediaService.listMedia(actor),
		uploadEnabled: mediaService.uploadEnabled,
		role: user.role as Role,
		userId: user.id
	};
};

export const actions: Actions = {
	delete: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await mediaService.deleteMedia(actor, id);
			return { deleted: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus media');
		}
	}
};
