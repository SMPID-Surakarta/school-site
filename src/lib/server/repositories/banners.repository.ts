import { and, asc, eq, getTableColumns, gte, isNull, lte, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { banners, media, type Banner, type NewBanner } from '$lib/db/schema';
/**
 * Banners repository — pure CRUD/query for the `banners` table. List filters out
 * soft-deleted rows unless `includeDeleted`.
 */

export async function list(includeDeleted = false): Promise<Banner[]> {
	return db
		.select()
		.from(banners)
		.where(includeDeleted ? undefined : isNull(banners.deletedAt))
		.orderBy(asc(banners.order), asc(banners.title));
}

export type PublicBanner = Banner & {
	imageUrl: string | null;
	imageAltText: string | null;
	imageWidth: number | null;
	imageHeight: number | null;
};

/** Published banners currently within their (optional) schedule window (public). */
export async function listActive(now: Date = new Date()): Promise<PublicBanner[]> {
	return db
		.select({
			...getTableColumns(banners),
			imageUrl: media.url,
			imageAltText: media.altText,
			imageWidth: media.width,
			imageHeight: media.height
		})
		.from(banners)
		.leftJoin(media, eq(banners.imageMediaId, media.id))
		.where(
			and(
				isNull(banners.deletedAt),
				eq(banners.published, true),
				or(isNull(banners.startAt), lte(banners.startAt, now)),
				or(isNull(banners.endAt), gte(banners.endAt, now))
			)
		)
		.orderBy(asc(banners.order), asc(banners.title));
}

export async function getById(id: string): Promise<Banner | undefined> {
	const [row] = await db
		.select()
		.from(banners)
		.where(and(eq(banners.id, id), isNull(banners.deletedAt)))
		.limit(1);
	return row;
}

export async function create(data: NewBanner): Promise<Banner> {
	const [row] = await db.insert(banners).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewBanner, 'id'>>
): Promise<Banner | undefined> {
	const [row] = await db.update(banners).set(data).where(eq(banners.id, id)).returning();
	return row;
}

export async function softDelete(id: string): Promise<Banner | undefined> {
	const [row] = await db
		.update(banners)
		.set({ deletedAt: new Date() })
		.where(and(eq(banners.id, id), isNull(banners.deletedAt)))
		.returning();
	return row;
}
