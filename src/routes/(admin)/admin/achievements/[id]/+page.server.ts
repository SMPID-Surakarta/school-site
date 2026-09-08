import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { isAppError } from '$lib/server/errors';
import {
	ACHIEVEMENT_CATEGORIES,
	ACHIEVEMENT_LEVELS,
	updateAchievementSchema
} from '$lib/server/validators/achievements';
import { LEGACY_ACHIEVEMENT_CATEGORIES, LEGACY_ACHIEVEMENT_LEVELS } from '$lib/utils/achievements';
import * as achievementsService from '$lib/server/services/achievements.service';
import { getMediaUrl, uploadEnabled } from '$lib/server/services/media.service';
import type { Actions, PageServerLoad } from './$types';

/** Cocokkan nilai lama (mis. 'kota' dari seed) ke opsi enum tanpa peduli kapitalisasi. */
function matchOption<T extends string>(value: string | null, options: readonly T[]): T | '' {
	if (!value) return '';
	return options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? '';
}

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const user = session!.user;
	const actor = { id: user.id, role: user.role };

	let item;
	try {
		item = await achievementsService.getAchievement(actor, event.params.id);
	} catch (err) {
		if (isAppError(err)) throw error(err.status, err.message);
		throw error(500, 'Gagal memuat prestasi');
	}

	return {
		form: await superValidate(
			{
				title: item.title,
				description: item.description ?? '',
				studentName: item.studentName ?? '',
				date: item.date ?? undefined,
				category:
					matchOption(item.category, ACHIEVEMENT_CATEGORIES) ||
					matchOption(item.category, LEGACY_ACHIEVEMENT_CATEGORIES) ||
					undefined,
				level:
					matchOption(item.level, ACHIEVEMENT_LEVELS) ||
					matchOption(item.level, LEGACY_ACHIEVEMENT_LEVELS) ||
					undefined,
				rank: item.rank ?? '',
				imageMediaId: item.imageMediaId ?? undefined
			},
			zod4(updateAchievementSchema)
		),
		storageEnabled: uploadEnabled,
		imageUrl: await getMediaUrl(item.imageMediaId),
		title: item.title
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const user = session!.user;
		const actor = { id: user.id, role: user.role };

		const form = await superValidate(event.request, zod4(updateAchievementSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await achievementsService.updateAchievement(actor, event.params.id, form.data);
		} catch (err) {
			if (isAppError(err)) return fail(err.status, { form, message: err.message });
			throw error(500, 'Gagal menyimpan prestasi');
		}

		redirect(303, '/admin/achievements');
	}
};
