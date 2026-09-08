import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { createAchievementSchema } from '$lib/server/validators/achievements';
import * as achievementsService from '$lib/server/services/achievements.service';
import { uploadEnabled } from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	if (!can(user.role as Role, 'create', 'achievements')) redirect(303, '/admin/achievements');

	return {
		form: await superValidate(zod4(createAchievementSchema)),
		storageEnabled: uploadEnabled
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(createAchievementSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await achievementsService.createAchievement(actor, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan prestasi');
		}

		redirect(303, '/admin/achievements');
	}
};
