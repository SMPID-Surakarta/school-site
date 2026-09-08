import { fail, error } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { type Role } from '$lib/rbac';
import { isAppError } from '$lib/server/errors';
import { settingsSchema } from '$lib/server/validators/settings';
import * as settingsService from '$lib/server/services/settings.service';
import * as menusService from '$lib/server/services/menus.service';
import type { FooterConfig } from '$lib/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();
	const role = session!.user.role as Role;

	const current = await settingsService.getSettings(role);
	const social = current?.socialMedia ?? {};
	const footer: FooterConfig = current?.footerConfig ?? {
		showContactSection: true,
		showQuickLinksSection: true,
		showLocationSection: true,
		showSocialMedia: true,
		selectedMenuIds: []
	};

	// Fetch available menus for footer selection (gracefully handle errors)
	let allMenus: Array<{ id: string; title: string }> = [];
	try {
		const menuTree = await menusService.getMenuTree({ id: session!.user.id, role });
		allMenus = menuTree.flatMap((node) => [
			{ id: node.id, title: node.title },
			...node.children.map((child) => ({ id: child.id, title: child.title }))
		]);
	} catch (err) {
		console.error('Failed to fetch menus for footer selection:', err);
		// Continue without menus - footer can still be configured
	}

	return {
		form: await superValidate(
			{
				schoolName: current?.schoolName ?? '',
				tagline: current?.tagline ?? '',
				description: current?.description ?? '',
				address: current?.address ?? '',
				phone: current?.phone ?? '',
				email: current?.email ?? '',
				instagram: social.instagram ?? '',
				youtube: social.youtube ?? '',
				facebook: social.facebook ?? '',
				tiktok: social.tiktok ?? '',
				googleMapsEmbed: current?.googleMapsEmbed ?? '',
				googleAnalyticsId: current?.googleAnalyticsId ?? '',
				footerBrandingText: footer.brandingText ?? '',
				footerCopyrightText: footer.copyrightText ?? '',
				footerShowContactSection: footer.showContactSection ?? true,
				footerShowQuickLinksSection: footer.showQuickLinksSection ?? true,
				footerShowLocationSection: footer.showLocationSection ?? true,
				footerShowSocialMedia: footer.showSocialMedia ?? true,
				footerSelectedMenuIds: footer.selectedMenuIds ?? []
			},
			zod4(settingsSchema)
		),
		menus: allMenus
	};
};

export const actions: Actions = {
	default: async (event) => {
		const session = await event.locals.auth();
		const role = session!.user.role as Role;

		const form = await superValidate(event.request, zod4(settingsSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await settingsService.saveSettings(role, form.data);
		} catch (err) {
			if (isAppError(err)) {
				form.message = err.message;
				return fail(err.status, { form });
			}
			throw error(500, 'Gagal menyimpan pengaturan');
		}

		return message(form, 'Pengaturan situs berhasil disimpan');
	}
};
