import { error } from '@sveltejs/kit';
import * as publicService from '$lib/server/services/public.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const album = await publicService.getGalleryAlbum(params.id);
	if (!album) throw error(404, 'Album tidak ditemukan');
	return { album };
};
