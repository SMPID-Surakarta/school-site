import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { achievements, media, type Achievement, type NewAchievement } from '$lib/db/schema';

/**
 * Achievements repository — the only place allowed to run Drizzle queries for the
 * `achievements` table. List filters out soft-deleted rows unless `includeDeleted`.
 */

export async function list(includeDeleted = false): Promise<Achievement[]> {
	return db
		.select()
		.from(achievements)
		.where(includeDeleted ? undefined : isNull(achievements.deletedAt))
		.orderBy(desc(achievements.date), desc(achievements.createdAt));
}

/** Public card shape: achievement plus resolved student-photo URL/alt. */
export type PublicAchievementCard = Achievement & {
	imageUrl: string | null;
	imageAltText: string | null;
};

/** Paginated public list (newest first) with the student photo joined in. */
export async function listPaginated(
	limit: number,
	offset: number
): Promise<PublicAchievementCard[]> {
	const rows = await db
		.select({
			achievement: achievements,
			imageUrl: media.url,
			imageAltText: media.altText
		})
		.from(achievements)
		.leftJoin(media, eq(achievements.imageMediaId, media.id))
		.where(isNull(achievements.deletedAt))
		.orderBy(desc(achievements.date), desc(achievements.createdAt))
		.limit(limit)
		.offset(offset);
	return rows.map((r) => ({
		...r.achievement,
		imageUrl: r.imageUrl,
		imageAltText: r.imageAltText
	}));
}

/** Total non-deleted achievements (for pagination). */
export async function count(): Promise<number> {
	const [row] = await db
		.select({ value: sql<number>`count(*)::int` })
		.from(achievements)
		.where(isNull(achievements.deletedAt));
	return row?.value ?? 0;
}

export async function getById(id: string): Promise<Achievement | undefined> {
	const [row] = await db
		.select()
		.from(achievements)
		.where(and(eq(achievements.id, id), isNull(achievements.deletedAt)))
		.limit(1);
	return row;
}

export async function create(data: NewAchievement): Promise<Achievement> {
	const [row] = await db.insert(achievements).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewAchievement, 'id'>>
): Promise<Achievement | undefined> {
	const [row] = await db.update(achievements).set(data).where(eq(achievements.id, id)).returning();
	return row;
}

export async function softDelete(id: string): Promise<Achievement | undefined> {
	const [row] = await db
		.update(achievements)
		.set({ deletedAt: new Date() })
		.where(and(eq(achievements.id, id), isNull(achievements.deletedAt)))
		.returning();
	return row;
}
