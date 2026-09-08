import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { postTags, tags, type NewTag, type Tag } from '$lib/db/schema';

/** Tags repository — pure CRUD/query for the `tags` table. */

export async function listAll(): Promise<Tag[]> {
	return db.select().from(tags).orderBy(asc(tags.name));
}

export async function listForPost(postId: string): Promise<Tag[]> {
	return db
		.select({ id: tags.id, name: tags.name, slug: tags.slug })
		.from(tags)
		.innerJoin(postTags, eq(postTags.tagId, tags.id))
		.where(eq(postTags.postId, postId))
		.orderBy(asc(tags.name));
}

export async function getBySlugs(slugs: string[]): Promise<Tag[]> {
	if (!slugs.length) return [];
	return db.select().from(tags).where(inArray(tags.slug, slugs));
}

export async function getByIds(ids: string[]): Promise<Tag[]> {
	if (!ids.length) return [];
	return db.select().from(tags).where(inArray(tags.id, ids));
}

export async function createMany(data: NewTag[]): Promise<Tag[]> {
	if (!data.length) return [];
	return db.insert(tags).values(data).returning();
}
