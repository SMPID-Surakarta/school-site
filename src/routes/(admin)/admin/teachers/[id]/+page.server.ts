import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateTeacherSchema } from '$lib/server/validators/teachers';
import * as teachersService from '$lib/server/services/teachers.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let teacher;
	try {
		teacher = await teachersService.getTeacher(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat data guru');
	}

	return {
		form: await superValidate(
			{
				name: teacher.name,
				slug: teacher.slug,
				position: teacher.position ?? '',
				subject: teacher.subject ?? '',
				nipNuptk: teacher.nipNuptk ?? '',
				bio: teacher.bio ?? '',
				photoMediaId: teacher.photoMediaId ?? undefined,
				isActive: teacher.isActive
			},
			zod4(updateTeacherSchema)
		),
		name: teacher.name
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateTeacherSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await teachersService.updateTeacher(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan data guru');
		}

		redirect(303, '/admin/teachers');
	}
};
