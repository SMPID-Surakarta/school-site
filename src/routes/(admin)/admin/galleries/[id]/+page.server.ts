import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateGallerySchema } from '$lib/server/validators/galleries';
import { uploadEnabled } from '$lib/server/services/media.service';
import * as galleriesService from '$lib/server/services/galleries.service';
import type { Actions, PageServerLoad } from './$types';

function toDateInputValue(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await galleriesService.getGallery(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat galeri');
	}

	return {
		form: await superValidate(
			{
				title: item.title,
				eventDate: toDateInputValue(item.eventDate),
				description: item.description ?? '',
				coverMediaId: item.coverMediaId ?? undefined,
				photoMediaIds: []
			},
			zod4(updateGallerySchema)
		),
		title: item.title,
		photos: item.photos,
		uploadEnabled
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateGallerySchema));
		if (!form.valid) return fail(400, { form });

		try {
			await galleriesService.updateGallery(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan galeri');
		}

		redirect(303, '/admin/galleries');
	},
	removePhoto: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const photoId = form.get('photoId');
		if (typeof photoId !== 'string' || !photoId)
			return fail(400, { message: 'ID foto tidak valid' });

		try {
			await galleriesService.removeGalleryPhoto(actor, event.params.id, photoId);
			return { removed: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus foto');
		}
	}
};
