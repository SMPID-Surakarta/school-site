import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { updateUserSchema } from '$lib/server/validators/users';
import * as usersService from '$lib/server/services/users.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const role = session!.user.role as Role;

	let target;
	try {
		target = await usersService.getUser(role, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat pengguna');
	}

	return {
		form: await superValidate(
			{ name: target.name, role: target.role, isActive: target.isActive },
			zod4(updateUserSchema)
		),
		email: target.email
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const role = session!.user.role as Role;

		const form = await superValidate(event.request, zod4(updateUserSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await usersService.updateUser(role, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan pengguna');
		}

		redirect(303, '/admin/users');
	}
};
