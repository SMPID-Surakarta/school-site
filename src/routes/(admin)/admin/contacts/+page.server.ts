import * as contactsService from '$lib/server/services/contacts.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	const contacts = await contactsService.listContacts(actor);

	return { contacts };
};
