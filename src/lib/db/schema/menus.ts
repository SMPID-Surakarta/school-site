import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const menus = pgTable('menus', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	url: text('url').notNull(),
	parentId: uuid('parent_id').references((): AnyPgColumn => menus.id, { onDelete: 'cascade' }),
	order: integer('order').notNull().default(0),
	visible: boolean('visible').notNull().default(true)
});

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;
