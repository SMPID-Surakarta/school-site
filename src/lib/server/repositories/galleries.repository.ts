import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	galleries,
	galleryPhotos,
	media,
	type Gallery,
	type GalleryPhoto,
	type NewGallery
} from '$lib/db/schema';

/**
 * Galleries repository — the only place allowed to run Drizzle queries for the
 * `galleries` table. List filters out soft-deleted rows unless `includeDeleted`.
 */

export async function list(includeDeleted = false): Promise<Gallery[]> {
	return db
		.select()
		.from(galleries)
		.where(includeDeleted ? undefined : isNull(galleries.deletedAt))
		.orderBy(desc(galleries.eventDate), desc(galleries.createdAt));
}

export type GalleryAlbumCard = Gallery & {
	coverUrl: string | null;
	coverAltText: string | null;
	coverWidth: number | null;
	coverHeight: number | null;
	photoCount: number;
};

export type GalleryPhotoItem = GalleryPhoto & {
	url: string;
	altText: string | null;
	width: number | null;
	height: number | null;
};

export type GalleryAlbumDetail = GalleryAlbumCard & {
	photos: GalleryPhotoItem[];
};

function toAlbumCard(row: {
	gallery: Gallery;
	coverUrl: string | null;
	coverAltText: string | null;
	coverWidth: number | null;
	coverHeight: number | null;
	photoCount: number;
}): GalleryAlbumCard {
	return {
		...row.gallery,
		coverUrl: row.coverUrl,
		coverAltText: row.coverAltText,
		coverWidth: row.coverWidth,
		coverHeight: row.coverHeight,
		photoCount: row.photoCount
	};
}

export async function listAlbums(includeDeleted = false): Promise<GalleryAlbumCard[]> {
	const rows = await db
		.select({
			gallery: galleries,
			coverUrl: media.url,
			coverAltText: media.altText,
			coverWidth: media.width,
			coverHeight: media.height,
			photoCount: sql<number>`count(${galleryPhotos.id})::int`
		})
		.from(galleries)
		.leftJoin(media, eq(galleries.coverMediaId, media.id))
		.leftJoin(galleryPhotos, eq(galleries.id, galleryPhotos.galleryId))
		.where(includeDeleted ? undefined : isNull(galleries.deletedAt))
		.groupBy(galleries.id, media.url, media.altText, media.width, media.height)
		.orderBy(desc(galleries.eventDate), desc(galleries.createdAt));
	return rows.map(toAlbumCard);
}

export async function getById(id: string): Promise<Gallery | undefined> {
	const [row] = await db
		.select()
		.from(galleries)
		.where(and(eq(galleries.id, id), isNull(galleries.deletedAt)))
		.limit(1);
	return row;
}

export async function getAlbumById(id: string): Promise<GalleryAlbumDetail | undefined> {
	const [albumRow] = await db
		.select({
			gallery: galleries,
			coverUrl: media.url,
			coverAltText: media.altText,
			coverWidth: media.width,
			coverHeight: media.height,
			photoCount: sql<number>`count(${galleryPhotos.id})::int`
		})
		.from(galleries)
		.leftJoin(media, eq(galleries.coverMediaId, media.id))
		.leftJoin(galleryPhotos, eq(galleries.id, galleryPhotos.galleryId))
		.where(and(eq(galleries.id, id), isNull(galleries.deletedAt)))
		.groupBy(galleries.id, media.url, media.altText, media.width, media.height)
		.limit(1);

	if (!albumRow) return undefined;
	const photos = await listPhotos(id);
	return { ...toAlbumCard(albumRow), photos };
}

export async function create(data: NewGallery): Promise<Gallery> {
	const [row] = await db.insert(galleries).values(data).returning();
	return row;
}

export async function createWithPhotos(
	data: NewGallery,
	photoMediaIds: string[]
): Promise<Gallery> {
	return db.transaction(async (tx) => {
		const [row] = await tx.insert(galleries).values(data).returning();
		if (photoMediaIds.length > 0) {
			await tx.insert(galleryPhotos).values(
				photoMediaIds.map((mediaId, index) => ({
					galleryId: row.id,
					mediaId,
					orderIndex: index
				}))
			);
		}
		return row;
	});
}

export async function update(
	id: string,
	data: Partial<Omit<NewGallery, 'id'>>
): Promise<Gallery | undefined> {
	const [row] = await db.update(galleries).set(data).where(eq(galleries.id, id)).returning();
	return row;
}

export async function addPhotos(galleryId: string, mediaIds: string[]): Promise<void> {
	if (mediaIds.length === 0) return;
	const existing = await listPhotos(galleryId);
	const existingIds = new Set(existing.map((item) => item.mediaId));
	const newIds = mediaIds.filter((id) => !existingIds.has(id));
	if (newIds.length === 0) return;
	await db.insert(galleryPhotos).values(
		newIds.map((mediaId, index) => ({
			galleryId,
			mediaId,
			orderIndex: existing.length + index
		}))
	);
}

export async function listPhotos(galleryId: string): Promise<GalleryPhotoItem[]> {
	const rows = await db
		.select({
			photo: galleryPhotos,
			url: media.url,
			altText: media.altText,
			width: media.width,
			height: media.height
		})
		.from(galleryPhotos)
		.innerJoin(media, eq(galleryPhotos.mediaId, media.id))
		.where(eq(galleryPhotos.galleryId, galleryId))
		.orderBy(asc(galleryPhotos.orderIndex), asc(galleryPhotos.createdAt));
	return rows.map((row) => ({
		...row.photo,
		url: row.url,
		altText: row.altText,
		width: row.width,
		height: row.height
	}));
}

export async function getPhoto(
	galleryId: string,
	photoId: string
): Promise<GalleryPhoto | undefined> {
	const [row] = await db
		.select()
		.from(galleryPhotos)
		.where(and(eq(galleryPhotos.galleryId, galleryId), eq(galleryPhotos.id, photoId)))
		.limit(1);
	return row;
}

export async function removePhoto(
	galleryId: string,
	photoId: string
): Promise<GalleryPhoto | undefined> {
	const [row] = await db
		.delete(galleryPhotos)
		.where(and(eq(galleryPhotos.galleryId, galleryId), eq(galleryPhotos.id, photoId)))
		.returning();
	return row;
}

export async function softDelete(id: string): Promise<Gallery | undefined> {
	const [row] = await db
		.update(galleries)
		.set({ deletedAt: new Date() })
		.where(and(eq(galleries.id, id), isNull(galleries.deletedAt)))
		.returning();
	return row;
}
