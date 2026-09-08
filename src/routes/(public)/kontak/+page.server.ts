import { fail, error } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { contactMessageSchema } from '$lib/server/validators/contacts';
import * as publicService from '$lib/server/services/public.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod4(contactMessageSchema)) };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod4(contactMessageSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await publicService.submitContact(form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal mengirim pesan');
		}

		return message(form, `Pesan berhasil dikirim. Nomor pengirim: ${form.data.phone}`);
	}
};
