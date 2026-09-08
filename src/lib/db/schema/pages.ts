import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

export const pages = pgTable('pages', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	content: text('content').notNull(),
	published: boolean('published').notNull().default(false),
	...timestamps
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
