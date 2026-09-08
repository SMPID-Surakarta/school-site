import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as galleriesRepo from '$lib/server/repositories/galleries.repository';
import type { CreateGalleryInput, UpdateGalleryInput } from '$lib/server/validators/galleries';
import type { Gallery, NewGallery } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function uniqueIds(ids: string[]): string[] {
	return [...new Set(ids)];
}

function parseDate(value: string): Date {
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) throw AppError.validation('Tanggal kegiatan tidak valid');
	return date;
}

function resolveCover(coverMediaId: string | undefined, photoMediaIds: string[]): string | null {
	if (!coverMediaId) return photoMediaIds[0] ?? null;
	if (!photoMediaIds.includes(coverMediaId)) {
		throw AppError.validation('Cover album harus dipilih dari foto album');
	}
	return coverMediaId;
}

export async function listGalleries(actor: Actor): Promise<galleriesRepo.GalleryAlbumCard[]> {
	if (!can(actor.role, 'read', 'galleries')) throw AppError.forbidden();
	return galleriesRepo.listAlbums();
}

export async function getGallery(
	actor: Actor,
	id: string
): Promise<galleriesRepo.GalleryAlbumDetail> {
	if (!can(actor.role, 'update', 'galleries')) throw AppError.forbidden();
	const row = await galleriesRepo.getAlbumById(id);
	if (!row) throw AppError.notFound('Galeri tidak ditemukan');
	return row;
}

export async function createGallery(actor: Actor, input: CreateGalleryInput): Promise<Gallery> {
	if (!can(actor.role, 'create', 'galleries')) throw AppError.forbidden();
	const photoMediaIds = uniqueIds(input.photoMediaIds);

	const data: NewGallery = {
		title: input.title,
		eventDate: parseDate(input.eventDate),
		description: emptyToNull(input.description),
		coverMediaId: resolveCover(input.coverMediaId, photoMediaIds)
	};
	return galleriesRepo.createWithPhotos(data, photoMediaIds);
}

export async function updateGallery(
	actor: Actor,
	id: string,
	input: UpdateGalleryInput
): Promise<Gallery> {
	if (!can(actor.role, 'update', 'galleries')) throw AppError.forbidden();

	const existing = await galleriesRepo.getAlbumById(id);
	if (!existing) throw AppError.notFound('Galeri tidak ditemukan');
	const newPhotoMediaIds = uniqueIds(input.photoMediaIds);
	const allPhotoMediaIds = [...existing.photos.map((photo) => photo.mediaId), ...newPhotoMediaIds];

	const data: Partial<Omit<NewGallery, 'id'>> = {
		title: input.title,
		eventDate: parseDate(input.eventDate),
		description: emptyToNull(input.description),
		coverMediaId: resolveCover(input.coverMediaId, allPhotoMediaIds)
	};
	const updated = await galleriesRepo.update(id, data);
	if (!updated) throw AppError.notFound('Galeri tidak ditemukan');
	await galleriesRepo.addPhotos(id, newPhotoMediaIds);
	return updated;
}

export async function removeGalleryPhoto(
	actor: Actor,
	galleryId: string,
	photoId: string
): Promise<void> {
	if (!can(actor.role, 'update', 'galleries')) throw AppError.forbidden();
	const existing = await galleriesRepo.getAlbumById(galleryId);
	if (!existing) throw AppError.notFound('Galeri tidak ditemukan');
	const photo = await galleriesRepo.getPhoto(galleryId, photoId);
	if (!photo) throw AppError.notFound('Foto tidak ditemukan');
	await galleriesRepo.removePhoto(galleryId, photoId);
	if (existing.coverMediaId === photo.mediaId) {
		const remaining = await galleriesRepo.listPhotos(galleryId);
		await galleriesRepo.update(galleryId, { coverMediaId: remaining[0]?.mediaId ?? null });
	}
}

export async function deleteGallery(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'galleries')) throw AppError.forbidden();
	const existing = await galleriesRepo.getById(id);
	if (!existing) throw AppError.notFound('Galeri tidak ditemukan');
	await galleriesRepo.softDelete(id);
}
