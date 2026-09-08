import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { downloads, type Download, type NewDownload } from '$lib/db/schema';

/** Downloads repository — pure CRUD/query for the `downloads` table. */

export async function list(): Promise<Download[]> {
	return db.select().from(downloads).orderBy(desc(downloads.createdAt));
}

export async function getById(id: string): Promise<Download | undefined> {
	const [row] = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
	return row;
}

export async function create(data: NewDownload): Promise<Download> {
	const [row] = await db.insert(downloads).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewDownload, 'id'>>
): Promise<Download | undefined> {
	const [row] = await db.update(downloads).set(data).where(eq(downloads.id, id)).returning();
	return row;
}

export async function remove(id: string): Promise<Download | undefined> {
	const [row] = await db.delete(downloads).where(eq(downloads.id, id)).returning();
	return row;
}
