import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateDownloadSchema } from '$lib/server/validators/downloads';
import * as downloadsService from '$lib/server/services/downloads.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await downloadsService.getDownload(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat berkas');
	}

	return {
		form: await superValidate(
			{
				title: item.title,
				url: item.url ?? '',
				category: item.category ?? '',
				size: item.size ?? '',
				fileMediaId: item.fileMediaId ?? undefined
			},
			zod4(updateDownloadSchema)
		),
		title: item.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateDownloadSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await downloadsService.updateDownload(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan berkas');
		}

		redirect(303, '/admin/downloads');
	}
};
