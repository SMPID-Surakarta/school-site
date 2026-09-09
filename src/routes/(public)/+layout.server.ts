import * as publicService from '$lib/server/services/public.service';
import * as mediaService from '$lib/server/services/media.service';
import { DEFAULT_SITE_NAME } from '$lib/seo';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const [settings, navigation] = await Promise.all([
		publicService.getSiteSettings(),
		publicService.getNavigation()
	]);

	// Get media URLs if they exist
	let logoUrl = undefined;
	if (settings?.logoMediaId) {
		logoUrl = await mediaService.getMediaUrl(settings.logoMediaId);
	}

	return {
		settings,
		navigation,
		siteName: settings?.schoolName || DEFAULT_SITE_NAME,
		origin: event.url.origin,
		logoUrl
	};
};
