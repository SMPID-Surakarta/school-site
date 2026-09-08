import { fail, error } from '@sveltejs/kit';
import { can, type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { postListQuerySchema } from '$lib/server/validators/posts';
import * as postsService from '$lib/server/services/posts.service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	// Query params come from the URL (user-editable): fall back to defaults when invalid
	// instead of crashing with an unhandled ZodError.
	const parsed = postListQuerySchema.safeParse({
		page: event.url.searchParams.get('page') ?? undefined,
		q: event.url.searchParams.get('q') ?? undefined,
		status: event.url.searchParams.get('status') ?? undefined,
		categoryId: event.url.searchParams.get('categoryId') ?? undefined
	});
	const query = parsed.success ? parsed.data : postListQuerySchema.parse({});

	const [result, categories] = await Promise.all([
		postsService.listPosts(actor, query),
		postsService.listCategories(actor)
	]);

	return {
		posts: result.items,
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
		totalPages: result.totalPages,
		counts: result.counts,
		filters: { q: query.q, status: query.status ?? '', categoryId: query.categoryId ?? '' },
		categories,
		role: user.role as Role,
		userId: user.id,
		canCreate: can(user.role as Role, 'create', 'posts')
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
			await postsService.deletePost(actor, id);
			return { deleted: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus post');
		}
	},

	bulkDelete: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const ids = form
			.getAll('ids')
			.filter((v): v is string => typeof v === 'string' && v.length > 0);
		if (!ids.length) return fail(400, { message: 'Tidak ada berita yang dipilih' });

		try {
			const count = await postsService.bulkDeletePosts(actor, ids);
			return { bulkDeleted: count };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus berita');
		}
	},

	togglePin: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		const pinned = form.get('pinned') === 'true';
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await postsService.setPinned(actor, id, pinned);
			return { pinned };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal memperbarui berita');
		}
	},

	restore: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await postsService.restorePost(actor, id);
			return { restored: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal memulihkan berita');
		}
	},

	hardDelete: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await event.request.formData();
		const id = form.get('id');
		if (typeof id !== 'string' || !id) return fail(400, { message: 'ID tidak valid' });

		try {
			await postsService.deletePostPermanently(actor, id);
			return { hardDeleted: true };
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { message: err.message });
			throw error(500, 'Gagal menghapus berita secara permanen');
		}
	}
};
