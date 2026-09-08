import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import { updateFaqSchema } from '$lib/server/validators/faqs';
import * as faqsService from '$lib/server/services/faqs.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await faqsService.getFaq(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat FAQ');
	}

	return {
		form: await superValidate(
			{ question: item.question, answer: item.answer, order: item.order },
			zod4(updateFaqSchema)
		),
		question: item.question
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateFaqSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await faqsService.updateFaq(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan FAQ');
		}

		redirect(303, '/admin/faqs');
	}
};
