import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone'),
	message: text('message').notNull(),
	read: boolean('read').notNull().default(false),
	// Tracking follow-up dari admin (PRD §4).
	repliedAt: timestamp('replied_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
