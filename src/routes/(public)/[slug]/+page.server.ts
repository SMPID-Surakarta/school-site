import { error } from '@sveltejs/kit';
import * as publicService from '$lib/server/services/public.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const page = await publicService.getPage(event.params.slug);
	if (!page) throw error(404, 'Halaman tidak ditemukan');
	return { page };
};
