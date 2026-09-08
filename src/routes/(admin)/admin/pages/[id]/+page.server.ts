import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updatePageSchema } from '$lib/server/validators/pages';
import * as pagesService from '$lib/server/services/pages.service';
import { uploadEnabled } from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await pagesService.getPage(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat halaman');
	}

	return {
		form: await superValidate(
			{ title: item.title, slug: item.slug, content: item.content, published: item.published },
			zod4(updatePageSchema)
		),
		storageEnabled: uploadEnabled,
		title: item.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updatePageSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await pagesService.updatePage(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan halaman');
		}

		redirect(303, '/admin/pages');
	}
};
