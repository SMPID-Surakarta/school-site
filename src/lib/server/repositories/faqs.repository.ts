import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { faqs, type Faq, type NewFaq } from '$lib/db/schema';

/** FAQs repository — pure CRUD/query for the `faqs` table. */

export async function list(): Promise<Faq[]> {
	return db.select().from(faqs).orderBy(asc(faqs.order));
}

export async function getById(id: string): Promise<Faq | undefined> {
	const [row] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
	return row;
}

export async function create(data: NewFaq): Promise<Faq> {
	const [row] = await db.insert(faqs).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewFaq, 'id'>>
): Promise<Faq | undefined> {
	const [row] = await db.update(faqs).set(data).where(eq(faqs.id, id)).returning();
	return row;
}

export async function remove(id: string): Promise<Faq | undefined> {
	const [row] = await db.delete(faqs).where(eq(faqs.id, id)).returning();
	return row;
}
