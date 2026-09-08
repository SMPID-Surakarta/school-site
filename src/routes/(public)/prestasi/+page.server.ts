import * as publicService from '$lib/server/services/public.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return await publicService.listAchievements(event.url.searchParams.get('page'));
};
