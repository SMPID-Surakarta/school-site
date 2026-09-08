import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const tags = pgTable('tags', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique()
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
