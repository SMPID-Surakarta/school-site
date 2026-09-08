import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateAgendaSchema } from '$lib/server/validators/agendas';
import * as agendasService from '$lib/server/services/agendas.service';
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
		item = await agendasService.getAgenda(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat agenda');
	}

	return {
		form: await superValidate(
			{
				title: item.title,
				description: item.description ?? '',
				startDate: toLocalInput(item.startDate),
				endDate: toLocalInput(item.endDate),
				location: item.location ?? ''
			},
			zod4(updateAgendaSchema)
		),
		title: item.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateAgendaSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await agendasService.updateAgenda(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan agenda');
		}

		redirect(303, '/admin/agendas');
	}
};
