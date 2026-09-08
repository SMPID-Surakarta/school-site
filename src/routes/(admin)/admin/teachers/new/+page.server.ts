import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { createTeacherSchema } from '$lib/server/validators/teachers';
import * as teachersService from '$lib/server/services/teachers.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	if (!can(user.role as Role, 'create', 'teachers')) redirect(303, '/admin/teachers');

	return {
		form: await superValidate(zod4(createTeacherSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(createTeacherSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await teachersService.createTeacher(actor, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan data guru');
		}

		redirect(303, '/admin/teachers');
	}
};
