import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';
import { softDelete, timestamps } from './_shared';

export const banners = pgTable('banners', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	titleFontSize: integer('title_font_size').notNull().default(60),
	subtitle: text('subtitle'),
	imageMediaId: uuid('image_media_id').references(() => media.id, { onDelete: 'set null' }),
	buttonText: text('button_text'),
	buttonUrl: text('button_url'),
	order: integer('order').notNull().default(0),
	published: boolean('published').notNull().default(false),
	// Banner promosi biasanya time-bound (mis. PPDB), nullable (PRD §4).
	startAt: timestamp('start_at', { withTimezone: true }),
	endAt: timestamp('end_at', { withTimezone: true }),
	...timestamps,
	...softDelete
});

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
