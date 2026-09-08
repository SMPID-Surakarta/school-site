import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import * as publicService from '$lib/server/services/public.service';
import { publicNewsSearchSchema } from '$lib/server/validators/public-news';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const post = await publicService.getNewsBySlug(event.params.slug);
	if (!post) throw error(404, 'Berita tidak ditemukan');
	return { post, searchForm: await superValidate(zod4(publicNewsSearchSchema)) };
};
