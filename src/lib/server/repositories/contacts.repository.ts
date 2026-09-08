import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { contacts, type Contact, type NewContact } from '$lib/db/schema';

/** Contacts repository — pure CRUD/query for the `contacts` table. */

export async function list(): Promise<Contact[]> {
	return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function getById(id: string): Promise<Contact | undefined> {
	const [row] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
	return row;
}

export async function create(data: NewContact): Promise<Contact> {
	const [row] = await db.insert(contacts).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewContact, 'id'>>
): Promise<Contact | undefined> {
	const [row] = await db.update(contacts).set(data).where(eq(contacts.id, id)).returning();
	return row;
}
