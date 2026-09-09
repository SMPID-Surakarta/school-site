import type { LayoutServerLoad } from './$types';
import * as publicService from '$lib/server/services/public.service';
import * as mediaService from '$lib/server/services/media.service';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth();

	// Load settings for favicon, logo, and other public data
	let settings = undefined;
	let faviconUrl = undefined;
	let logoUrl = undefined;

	try {
		settings = await publicService.getSiteSettings();

		// Get favicon and logo URLs if they exist
		if (settings?.faviconMediaId) {
			faviconUrl = await mediaService.getMediaUrl(settings.faviconMediaId);
		}
		if (settings?.logoMediaId) {
			logoUrl = await mediaService.getMediaUrl(settings.logoMediaId);
		}
	} catch (err) {
		// If fetch fails, continue without settings
		console.error('Failed to load settings:', err);
	}

	return {
		session,
		settings,
		faviconUrl,
		logoUrl
	};
};
