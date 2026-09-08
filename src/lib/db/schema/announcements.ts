import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const announcements = pgTable('announcements', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	priority: integer('priority').notNull().default(0),
	expiredAt: timestamp('expired_at', { withTimezone: true }),
	// Opsional untuk pemakaian lintas modul di masa depan: all/guru/siswa.
	targetRole: text('target_role'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
