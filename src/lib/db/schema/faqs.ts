import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const faqs = pgTable('faqs', {
	id: uuid('id').defaultRandom().primaryKey(),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	order: integer('order').notNull().default(0)
});

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
