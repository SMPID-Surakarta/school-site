import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import * as mediaService from '$lib/server/services/media.service';
import * as settingsService from '$lib/server/services/settings.service';
import { landingPageSchema } from '$lib/server/validators/landing-page';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const role = session!.user.role as Role;
	const current = await settingsService.getLandingPage(role);
	const facilityImageUrls = await mediaService.getMediaUrls(
		current.facilities.map((facility) => facility.imageMediaId)
	);

	return {
		form: await superValidate(current, zod4(landingPageSchema)),
		storageEnabled: mediaService.uploadEnabled,
		facilityImageUrls: current.facilities.map((facility) =>
			facility.imageMediaId ? (facilityImageUrls[facility.imageMediaId] ?? null) : null
		)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const role = session!.user.role as Role;
		const form = await superValidate(event.request, zod4(landingPageSchema));

		if (!form.valid) return fail(400, { form });

		try {
			await settingsService.saveLandingPage(role, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan landing page');
		}

		return message(form, 'Landing page berhasil diperbarui');
	}
};
