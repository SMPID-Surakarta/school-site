import { z } from 'zod';

const optionalUrl = z.string().trim().url('URL tidak valid').max(300).optional().or(z.literal(''));

export const settingsSchema = z.object({
	schoolName: z.string().trim().min(1, 'Nama sekolah wajib diisi').max(200),
	tagline: z.string().trim().max(200).optional().or(z.literal('')),
	description: z.string().trim().max(2000).optional().or(z.literal('')),
	address: z.string().trim().max(500).optional().or(z.literal('')),
	phone: z.string().trim().max(60).optional().or(z.literal('')),
	email: z.string().trim().email('Format email tidak valid').max(200).optional().or(z.literal('')),
	instagram: optionalUrl,
	youtube: optionalUrl,
	facebook: optionalUrl,
	tiktok: optionalUrl,
	googleMapsEmbed: z.string().trim().max(2000).optional().or(z.literal('')),
	googleAnalyticsId: z.string().trim().max(60).optional().or(z.literal('')),
	// Logo dan Favicon
	logoMediaId: z.string().uuid().nullable().optional().default(null),
	faviconMediaId: z.string().uuid().nullable().optional().default(null),
	// Footer config
	footerBrandingText: z.string().trim().max(500).optional().or(z.literal('')),
	footerCopyrightText: z.string().trim().max(200).optional().or(z.literal('')),
	footerShowContactSection: z.boolean().default(true),
	footerShowQuickLinksSection: z.boolean().default(true),
	footerShowLocationSection: z.boolean().default(true),
	footerShowSocialMedia: z.boolean().default(true),
	footerSelectedMenuIds: z.array(z.string().uuid()).default([])
});
export type SettingsInput = z.infer<typeof settingsSchema>;
