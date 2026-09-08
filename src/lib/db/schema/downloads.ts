import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';

export const downloads = pgTable('downloads', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	fileMediaId: uuid('file_media_id').references(() => media.id, { onDelete: 'set null' }),
	url: text('url'),
	size: text('size'),
	// mis. "Formulir PPDB", "Kalender Akademik" (PRD §4).
	category: text('category'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Download = typeof downloads.$inferSelect;
export type NewDownload = typeof downloads.$inferInsert;
