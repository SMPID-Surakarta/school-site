import { check, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { media } from './media';
import type { ThemeConfig } from '$lib/utils/theme';

/**
 * Single-row configuration table. Always enforced to `id = 1` via a check constraint
 * so there is never more than one settings row (PRD §4 settings).
 */
export type SocialMedia = {
	instagram?: string;
	youtube?: string;
	facebook?: string;
	tiktok?: string;
};

export type LandingPageFacility = {
	title: string;
	description: string;
	imageMediaId?: string;
};

export type LandingPageConfig = {
	heroEyebrow: string;
	heroTitle: string;
	heroDescription: string;
	heroCtaText: string;
	heroCtaUrl: string;
	showStats: boolean;
	showAnnouncement: boolean;
	announcementLabel: string;
	announcementTitle: string;
	announcementDescription: string;
	announcementCtaText: string;
	announcementCtaUrl: string;
	showPinnedPosts: boolean;
	pinnedPostsTitle: string;
	showLatestPosts: boolean;
	latestPostsTitle: string;
	latestPostsLimit: number;
	showAchievements: boolean;
	achievementsTitle: string;
	achievementsLimit: number;
	showFacilities: boolean;
	facilitiesTitle: string;
	facilities: LandingPageFacility[];
	showAgendas: boolean;
	agendasTitle: string;
	agendasLimit: number;
};

export type FooterConfig = {
	brandingText?: string;
	copyrightText?: string;
	showContactSection: boolean;
	showQuickLinksSection: boolean;
	showLocationSection: boolean;
	showSocialMedia: boolean;
	selectedMenuIds: string[];
};

export const settings = pgTable(
	'settings',
	{
		id: integer('id').primaryKey().default(1).$type<1>(),
		schoolName: text('school_name').notNull().default(''),
		tagline: text('tagline'),
		description: text('description'),
		address: text('address'),
		phone: text('phone'),
		email: text('email'),
		logoMediaId: uuid('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
		faviconMediaId: uuid('favicon_media_id').references(() => media.id, { onDelete: 'set null' }),
		heroImageMediaId: uuid('hero_image_media_id').references(() => media.id, {
			onDelete: 'set null'
		}),
		landingPage: jsonb('landing_page').$type<LandingPageConfig>(),
		socialMedia: jsonb('social_media').$type<SocialMedia>(),
		footerConfig: jsonb('footer_config').$type<FooterConfig>(),
		themeConfig: jsonb('theme_config').$type<ThemeConfig>(),
		googleMapsEmbed: text('google_maps_embed'),
		googleAnalyticsId: text('google_analytics_id'),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date())
	},
	(table) => [check('settings_single_row', sql`${table.id} = 1`)]
);

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
