import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updatePostSchema } from '$lib/server/validators/posts';
import * as postsService from '$lib/server/services/posts.service';
import { getMediaUrl, uploadEnabled } from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let formData;
	try {
		formData = await postsService.getPostFormData(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat post');
	}

	return {
		form: await superValidate(formData, zod4(updatePostSchema)),
		categories: await postsService.listCategories(actor),
		storageEnabled: uploadEnabled,
		thumbnailUrl: await getMediaUrl(formData.thumbnailMediaId),
		title: formData.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updatePostSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await postsService.updatePost(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan post');
		}

		redirect(303, '/admin/posts');
	}
};
