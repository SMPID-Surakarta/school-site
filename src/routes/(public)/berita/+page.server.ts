import * as publicService from '$lib/server/services/public.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const result = await publicService.listNews(
		event.url.searchParams.get('page'),
		event.url.searchParams.get('category')
	);
	return result;
};
