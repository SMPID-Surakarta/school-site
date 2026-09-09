import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as mediaRepo from '$lib/server/repositories/media.repository';
import * as storage from '$lib/server/storage';
import type { Media } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

/** Whether media upload is available (always true with local-disk storage). */
export const uploadEnabled: boolean = storage.isStorageConfigured;

/** List media for the library. ADMIN sees all; EDITOR sees their own uploads by default, or all when selecting. */
export async function listMedia(
	actor: Actor,
	options?: { all?: boolean; limit?: number }
): Promise<Media[]> {
	if (!can(actor.role, 'read', 'media')) throw AppError.forbidden();
	const limit = options?.limit ?? 200;
	return actor.role === 'ADMIN' || options?.all
		? mediaRepo.listRecent(limit)
		: mediaRepo.listByUploader(actor.id, limit);
}

export async function uploadImage(actor: Actor, file: File, altText?: string): Promise<Media> {
	if (!can(actor.role, 'upload', 'media')) throw AppError.forbidden();
	return storage.uploadImage(file, { altText: altText?.trim() || null, uploadedBy: actor.id });
}

export async function uploadFile(actor: Actor, file: File): Promise<Media> {
	if (!can(actor.role, 'upload', 'media')) throw AppError.forbidden();
	return storage.uploadFile(file, { uploadedBy: actor.id });
}

export async function deleteMedia(actor: Actor, id: string): Promise<void> {
	const item = await mediaRepo.getById(id);
	if (!item) throw AppError.notFound('Media tidak ditemukan');
	if (!can(actor.role, 'delete', 'media', { userId: actor.id, ownerId: item.uploadedBy })) {
		throw AppError.forbidden();
	}
	await storage.deleteMedia(id);
}

/** Resolve the public URL for a media id (for rendering existing thumbnails in forms). */
export async function getMediaUrl(id: string | null | undefined): Promise<string | null> {
	if (!id) return null;
	const item = await mediaRepo.getById(id);
	return item?.url ?? null;
}

export async function getMediaUrls(
	ids: Array<string | undefined>
): Promise<Record<string, string>> {
	const mediaIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
	const items = await mediaRepo.getByIds(mediaIds);
	return Object.fromEntries(items.map((item) => [item.id, item.url]));
}
