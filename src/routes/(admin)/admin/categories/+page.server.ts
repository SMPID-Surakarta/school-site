import { fail, error } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { categorySchema } from '$lib/server/validators/categories';
import * as categoriesService from '$lib/server/services/categories.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	return {
		categories: await categoriesService.listCategoriesWithCounts(actor),
		form: await superValidate(zod4(categorySchema)),
		canWrite: can(user.role as Role, 'create', 'posts')
	};
};

export const actions: Actions = {
	save: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(categorySchema));
		if (!form.valid) return fail(400, { form });

		try {
			if (form.data.id) {
				await categoriesService.updateCategory(actor, form.data.id, form.data);
				return message(form, 'Kategori diperbarui');
			}
			await categoriesService.createCategory(actor, form.data);
			return message(form, 'Kategori ditambahkan');
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan kategori');
		}
	},

	delete: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await categoriesService.deleteCategory(actor, id);
			return { deleted: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus kategori');
		}
	}
};
