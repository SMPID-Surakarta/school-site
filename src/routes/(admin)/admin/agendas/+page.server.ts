import { fail, error } from '@sveltejs/kit';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import * as agendasService from '$lib/server/services/agendas.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	const agendas = await agendasService.listAgendas(actor);

	return {
		agendas,
		canWrite: can(user.role as Role, 'create', 'agendas')
	};
};

export const actions: Actions = {
	delete: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await agendasService.deleteAgenda(actor, id);
			return { deleted: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus agenda');
		}
	}
};
