import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pages, type NewPage, type Page } from '$lib/db/schema';

/** Pages repository — pure CRUD/query for the `pages` table. */

export async function list(): Promise<Page[]> {
	return db.select().from(pages).orderBy(asc(pages.title));
}

export async function getById(id: string): Promise<Page | undefined> {
	const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
	return row;
}

/** Published page by slug (public). */
export async function getPublishedBySlug(slug: string): Promise<Page | undefined> {
	const [row] = await db
		.select()
		.from(pages)
		.where(and(eq(pages.slug, slug), eq(pages.published, true)))
		.limit(1);
	return row;
}

/** All published pages (public, sitemap). */
export async function listPublished(): Promise<Page[]> {
	return db.select().from(pages).where(eq(pages.published, true)).orderBy(asc(pages.title));
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
	const conditions = [eq(pages.slug, slug)];
	if (exceptId) conditions.push(ne(pages.id, exceptId));
	const [row] = await db
		.select({ id: pages.id })
		.from(pages)
		.where(and(...conditions))
		.limit(1);
	return Boolean(row);
}

export async function create(data: NewPage): Promise<Page> {
	const [row] = await db.insert(pages).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewPage, 'id'>>
): Promise<Page | undefined> {
	const [row] = await db.update(pages).set(data).where(eq(pages.id, id)).returning();
	return row;
}

export async function remove(id: string): Promise<Page | undefined> {
	const [row] = await db.delete(pages).where(eq(pages.id, id)).returning();
	return row;
}
