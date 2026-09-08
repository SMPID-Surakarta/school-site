import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { createGallerySchema } from '$lib/server/validators/galleries';
import { uploadEnabled } from '$lib/server/services/media.service';
import * as galleriesService from '$lib/server/services/galleries.service';
import type { Actions, PageServerLoad } from './$types';

function todayInputValue(): string {
	return new Date().toISOString().slice(0, 10);
}

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	if (!can(user.role as Role, 'create', 'galleries')) redirect(303, '/admin/galleries');

	return {
		form: await superValidate(
			{ title: '', eventDate: todayInputValue(), description: '', photoMediaIds: [] },
			zod4(createGallerySchema)
		),
		uploadEnabled
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(createGallerySchema));
		if (!form.valid) return fail(400, { form });

		try {
			await galleriesService.createGallery(actor, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan galeri');
		}

		redirect(303, '/admin/galleries');
	}
};
