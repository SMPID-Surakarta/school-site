import { fail, error } from '@sveltejs/kit';
import { isAppError } from '$lib/server/errors';
import * as contactsService from '$lib/server/services/contacts.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	try {
		const contact = await contactsService.getContact(actor, event.params.id);
		return { contact };
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat pesan');
	}
};

export const actions: Actions = {
	reply: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		try {
			await contactsService.markReplied(actor, event.params.id);
			return { replied: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menandai pesan');
		}
	}
};
