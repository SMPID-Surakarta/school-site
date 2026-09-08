import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import * as settingsService from '$lib/server/services/settings.service';
import { themeSchema } from '$lib/server/validators/theme';
import type { Role } from '$lib/rbac';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const role = session!.user.role as Role;
	const current = await settingsService.getTheme(role);
	const settings = await settingsService.getSettings(role);
	return {
		form: await superValidate(current, zod4(themeSchema)),
		schoolName: settings?.schoolName || 'Sekolah'
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const role = session!.user.role as Role;
		const form = await superValidate(event.request, zod4(themeSchema));
		if (!form.valid) return fail(400, { form });
		try {
			await settingsService.saveTheme(role, form.data);
		} catch (err) {
			if (isAppError(err))
				return fail(err.status, { form: { ...form, valid: false, message: err.message } });
			throw error(500, 'Gagal menyimpan tema');
		}
		return message(form, 'Tema berhasil diperbarui');
	}
};
