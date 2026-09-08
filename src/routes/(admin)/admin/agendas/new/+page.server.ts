import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { createAgendaSchema } from '$lib/server/validators/agendas';
import * as agendasService from '$lib/server/services/agendas.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	if (!can(user.role as Role, 'create', 'agendas')) redirect(303, '/admin/agendas');

	return {
		form: await superValidate(zod4(createAgendaSchema))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(createAgendaSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await agendasService.createAgenda(actor, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan agenda');
		}

		redirect(303, '/admin/agendas');
	}
};
