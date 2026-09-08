import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { saveMenuTreeSchema } from '$lib/server/validators/menus';
import * as menusService from '$lib/server/services/menus.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	const [tree, pageLinks] = await Promise.all([
		menusService.getMenuTree(actor),
		menusService.listPageLinks(actor)
	]);

	return {
		form: await superValidate({ items: tree }, zod4(saveMenuTreeSchema)),
		pageLinks
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(saveMenuTreeSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await menusService.saveMenuTree(actor, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan menu');
		}

		// Return the fresh tree so new items get their generated ids.
		const tree = await menusService.getMenuTree(actor);
		const freshForm = await superValidate({ items: tree }, zod4(saveMenuTreeSchema));
		return message(freshForm, 'Menu navigasi berhasil disimpan');
	}
};
