import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as settingsRepo from '$lib/server/repositories/settings.repository';
import {
	defaultLandingPage,
	landingPageSchema,
	type LandingPageInput
} from '$lib/server/validators/landing-page';
import type { SettingsInput } from '$lib/server/validators/settings';
import { themeSchema, type ThemeInput } from '$lib/server/validators/theme';
import { defaultTheme } from '$lib/utils/theme';
import type { Settings, SocialMedia, FooterConfig } from '$lib/db/schema';

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export async function getSettings(actorRole: Role): Promise<Settings | undefined> {
	if (!can(actorRole, 'read', 'settings')) throw AppError.forbidden();
	return settingsRepo.get();
}

export async function getLandingPage(actorRole: Role): Promise<LandingPageInput> {
	if (!can(actorRole, 'read', 'settings')) throw AppError.forbidden();
	const current = await settingsRepo.get();
	return current?.landingPage ? landingPageSchema.parse(current.landingPage) : defaultLandingPage;
}

export async function saveLandingPage(actorRole: Role, input: LandingPageInput): Promise<Settings> {
	if (!can(actorRole, 'update', 'settings')) throw AppError.forbidden();
	return settingsRepo.upsert({ landingPage: landingPageSchema.parse(input) });
}

export async function getTheme(actorRole: Role): Promise<ThemeInput> {
	if (!can(actorRole, 'read', 'settings')) throw AppError.forbidden();
	const current = await settingsRepo.get();
	const result = themeSchema.safeParse(current?.themeConfig ?? {});
	return result.success ? result.data : { ...defaultTheme };
}

export async function saveTheme(actorRole: Role, input: ThemeInput): Promise<Settings> {
	if (!can(actorRole, 'update', 'settings')) throw AppError.forbidden();
	const result = themeSchema.safeParse(input);
	if (!result.success)
		throw AppError.validation('Konfigurasi tema tidak valid', result.error.flatten());
	return settingsRepo.upsert({ themeConfig: result.data });
}

export async function saveSettings(actorRole: Role, input: SettingsInput): Promise<Settings> {
	if (!can(actorRole, 'update', 'settings')) throw AppError.forbidden();

	const socialMedia: SocialMedia = {};
	if (input.instagram) socialMedia.instagram = input.instagram;
	if (input.youtube) socialMedia.youtube = input.youtube;
	if (input.facebook) socialMedia.facebook = input.facebook;
	if (input.tiktok) socialMedia.tiktok = input.tiktok;

	const footerConfig: FooterConfig = {
		showContactSection: input.footerShowContactSection,
		showQuickLinksSection: input.footerShowQuickLinksSection,
		showLocationSection: input.footerShowLocationSection,
		showSocialMedia: input.footerShowSocialMedia,
		selectedMenuIds: input.footerSelectedMenuIds || []
	};

	// Only include optional text fields if they have non-empty values
	const brandingText = emptyToNull(input.footerBrandingText);
	if (brandingText) {
		footerConfig.brandingText = brandingText;
	}

	const copyrightText = emptyToNull(input.footerCopyrightText);
	if (copyrightText) {
		footerConfig.copyrightText = copyrightText;
	}

	return settingsRepo.upsert({
		schoolName: input.schoolName,
		tagline: emptyToNull(input.tagline),
		description: emptyToNull(input.description),
		address: emptyToNull(input.address),
		phone: emptyToNull(input.phone),
		email: emptyToNull(input.email),
		socialMedia: Object.keys(socialMedia).length ? socialMedia : null,
		googleMapsEmbed: emptyToNull(input.googleMapsEmbed),
		googleAnalyticsId: emptyToNull(input.googleAnalyticsId),
		footerConfig: footerConfig
	});
}
