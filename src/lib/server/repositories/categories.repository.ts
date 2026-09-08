import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, posts, type Category, type NewCategory } from '$lib/db/schema';

/** Categories repository — pure CRUD/query for the `categories` table. */

export async function listAll(): Promise<Category[]> {
	return db.select().from(categories).orderBy(asc(categories.name));
}

/** Category plus the number of non-deleted posts assigned to it. */
export type CategoryWithCount = Category & { postCount: number };

export async function listWithPostCounts(): Promise<CategoryWithCount[]> {
	return db
		.select({
			id: categories.id,
			name: categories.name,
			slug: categories.slug,
			postCount: sql<number>`count(${posts.id})::int`
		})
		.from(categories)
		.leftJoin(posts, and(eq(posts.categoryId, categories.id), isNull(posts.deletedAt)))
		.groupBy(categories.id)
		.orderBy(asc(categories.name));
}

export async function getById(id: string): Promise<Category | undefined> {
	const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
	return row;
}

/** Whether a slug is already taken by another category. */
export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
	const conditions = [eq(categories.slug, slug)];
	if (exceptId) conditions.push(ne(categories.id, exceptId));
	const [row] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(and(...conditions))
		.limit(1);
	return Boolean(row);
}

export async function create(data: NewCategory): Promise<Category> {
	const [row] = await db.insert(categories).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewCategory, 'id'>>
): Promise<Category | undefined> {
	const [row] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
	return row;
}

/** Delete a category; posts referencing it get `categoryId` set to null (FK on delete). */
export async function remove(id: string): Promise<boolean> {
	const rows = await db
		.delete(categories)
		.where(eq(categories.id, id))
		.returning({ id: categories.id });
	return rows.length > 0;
}
