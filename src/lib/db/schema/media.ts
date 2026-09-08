import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Uploaded files. Content tables reference `media.id` via `*MediaId` FKs instead of
 * storing free-form URL strings (PRD §4). `altText`, `width`, `height` support SEO/CLS.
 */
export const media = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	mime: text('mime').notNull(),
	size: integer('size').notNull(),
	r2Key: text('r2_key').notNull().unique(),
	url: text('url').notNull(),
	altText: text('alt_text'),
	width: integer('width'),
	height: integer('height'),
	uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
