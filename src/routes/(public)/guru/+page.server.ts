import * as publicService from '$lib/server/services/public.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { teachers: await publicService.listTeachers() };
};
