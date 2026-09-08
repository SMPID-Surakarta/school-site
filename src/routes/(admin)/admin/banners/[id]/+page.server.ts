import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateBannerSchema } from '$lib/server/validators/banners';
import * as bannersService from '$lib/server/services/banners.service';
import { getMediaUrl, uploadEnabled } from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

/** Format a Date to a `datetime-local`-compatible string (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(value: Date | null): string {
	if (!value) return '';
	const d = new Date(value);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await bannersService.getBanner(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat banner');
	}

	return {
		form: await superValidate(
			{
				title: item.title,
				titleFontSize: item.titleFontSize,
				subtitle: item.subtitle ?? '',
				buttonText: item.buttonText ?? '',
				buttonUrl: item.buttonUrl ?? '',
				order: item.order,
				published: item.published,
				startAt: toLocalInput(item.startAt),
				endAt: toLocalInput(item.endAt),
				imageMediaId: item.imageMediaId ?? undefined
			},
			zod4(updateBannerSchema)
		),
		storageEnabled: uploadEnabled,
		imageUrl: await getMediaUrl(item.imageMediaId),
		title: item.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateBannerSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await bannersService.updateBanner(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan banner');
		}

		redirect(303, '/admin/banners');
	}
};
