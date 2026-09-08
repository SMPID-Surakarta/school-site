import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { media, type Media, type NewMedia } from '$lib/db/schema';

/** Media repository — sole owner of Drizzle queries for the `media` table. */

export async function getById(id: string): Promise<Media | undefined> {
	const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
	return row;
}

export async function getByIds(ids: string[]): Promise<Media[]> {
	if (ids.length === 0) return [];
	return db.select().from(media).where(inArray(media.id, ids));
}

export async function getByKey(key: string): Promise<Media | undefined> {
	const [row] = await db.select().from(media).where(eq(media.r2Key, key)).limit(1);
	return row;
}

export async function create(data: NewMedia): Promise<Media> {
	const [row] = await db.insert(media).values(data).returning();
	return row;
}

export async function remove(id: string): Promise<void> {
	await db.delete(media).where(eq(media.id, id));
}

export async function listRecent(limit = 50): Promise<Media[]> {
	return db.select().from(media).orderBy(desc(media.createdAt)).limit(limit);
}

export async function listByUploader(uploadedBy: string, limit = 50): Promise<Media[]> {
	return db
		.select()
		.from(media)
		.where(eq(media.uploadedBy, uploadedBy))
		.orderBy(desc(media.createdAt))
		.limit(limit);
}
