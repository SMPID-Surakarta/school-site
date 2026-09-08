import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).default('');
const optionalLink = z
	.string()
	.trim()
	.max(300)
	.refine(
		(value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
		'Gunakan path internal (/halaman) atau URL http(s)'
	)
	.default('');

const facilitySchema = z.object({
	title: z.string().trim().min(1, 'Nama fasilitas wajib diisi').max(100),
	description: optionalText(240),
	imageMediaId: z.string().uuid().optional()
});

const defaultFacilities = [
	{
		title: 'Laboratorium Praktik',
		description: 'Ruang praktik berstandar industri untuk pembelajaran berbasis kompetensi.'
	},
	{
		title: 'Perpustakaan',
		description: 'Sumber belajar yang nyaman dengan koleksi cetak dan digital.'
	},
	{
		title: 'Ruang Kolaborasi',
		description: 'Area diskusi dan pengembangan proyek lintas program keahlian.'
	}
];

const landingPageFields = z.object({
	heroEyebrow: optionalText(120),
	heroTitle: optionalText(200),
	heroDescription: optionalText(500),
	heroCtaText: optionalText(80),
	heroCtaUrl: optionalLink,
	showStats: z.boolean().default(true),
	showAnnouncement: z.boolean().default(true),
	announcementLabel: optionalText(40),
	announcementTitle: optionalText(160),
	announcementDescription: optionalText(300),
	announcementCtaText: optionalText(80),
	announcementCtaUrl: optionalLink,
	showPinnedPosts: z.boolean().default(true),
	pinnedPostsTitle: optionalText(120),
	showLatestPosts: z.boolean().default(true),
	latestPostsTitle: optionalText(120),
	latestPostsLimit: z.number().int().min(2).max(8).default(6),
	showAchievements: z.boolean().default(true),
	achievementsTitle: optionalText(120),
	achievementsLimit: z.number().int().min(1).max(6).default(6),
	showFacilities: z.boolean().default(true),
	facilitiesTitle: optionalText(120),
	facilities: z.array(facilitySchema).min(1).max(6).default(defaultFacilities),
	showAgendas: z.boolean().default(true),
	agendasTitle: optionalText(120),
	agendasLimit: z.number().int().min(1).max(10).default(5)
});

export const landingPageSchema = z.preprocess((value) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

	const config = value as Record<string, unknown>;
	return {
		...config,
		showAnnouncement: config.showAnnouncement ?? config.showPpdb,
		announcementLabel: config.announcementLabel ?? config.ppdbLabel,
		announcementTitle: config.announcementTitle ?? config.ppdbTitle,
		announcementDescription: config.announcementDescription ?? config.ppdbDescription,
		announcementCtaText: config.announcementCtaText ?? config.ppdbCtaText,
		announcementCtaUrl: config.announcementCtaUrl ?? config.ppdbCtaUrl
	};
}, landingPageFields);

export type LandingPageInput = z.infer<typeof landingPageSchema>;

export const defaultLandingPage: LandingPageInput = landingPageSchema.parse({});
