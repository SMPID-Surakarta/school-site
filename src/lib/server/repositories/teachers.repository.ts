import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { media, teachers, type NewTeacher, type Teacher } from '$lib/db/schema';

/**
 * Teachers repository — the only place allowed to run Drizzle queries for the
 * `teachers` table. Pure CRUD/query, no business logic or permission checks.
 */

export async function list(): Promise<Teacher[]> {
	return db.select().from(teachers).orderBy(asc(teachers.name));
}

/** Active teachers only (public directory). */
export async function listActive(): Promise<Teacher[]> {
	return db.select().from(teachers).where(eq(teachers.isActive, true)).orderBy(asc(teachers.name));
}

export type PublicTeacher = Teacher & {
	photoUrl: string | null;
	photoAltText: string | null;
	photoWidth: number | null;
	photoHeight: number | null;
};

/** Active teachers with the media metadata needed by the public directory. */
export async function listActivePublic(): Promise<PublicTeacher[]> {
	const rows = await db
		.select({ teacher: teachers, photo: media })
		.from(teachers)
		.leftJoin(media, eq(teachers.photoMediaId, media.id))
		.where(eq(teachers.isActive, true))
		.orderBy(asc(teachers.name));

	return rows.map(({ teacher, photo }) => ({
		...teacher,
		photoUrl: photo?.url ?? null,
		photoAltText: photo?.altText ?? null,
		photoWidth: photo?.width ?? null,
		photoHeight: photo?.height ?? null
	}));
}

export async function getById(id: string): Promise<Teacher | undefined> {
	const [row] = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
	return row;
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
	const conditions = [eq(teachers.slug, slug)];
	if (exceptId) conditions.push(ne(teachers.id, exceptId));
	const [row] = await db
		.select({ id: teachers.id })
		.from(teachers)
		.where(and(...conditions))
		.limit(1);
	return Boolean(row);
}

export async function create(data: NewTeacher): Promise<Teacher> {
	const [row] = await db.insert(teachers).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewTeacher, 'id'>>
): Promise<Teacher | undefined> {
	const [row] = await db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
	return row;
}

export async function remove(id: string): Promise<Teacher | undefined> {
	const [row] = await db.delete(teachers).where(eq(teachers.id, id)).returning();
	return row;
}
