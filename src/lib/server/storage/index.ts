import { randomUUID } from 'node:crypto';
import type { Media } from '$lib/db/schema';
import { AppError } from '$lib/server/errors';
import * as mediaRepo from '$lib/server/repositories/media.repository';
import {
	MAX_FILE_BYTES,
	MAX_IMAGE_BYTES,
	isAllowedFileMime,
	isAllowedImageMime
} from '$lib/server/validators/media';
import { processImage } from './images';
import { deleteObject, putObject, readObject } from './local';

/**
 * Storage facade. All media create/delete flows go through here so that disk writes and
 * the `media` table stay in sync (storage.instructions). Never touch the upload
 * directory directly elsewhere.
 */

/** Local-disk storage is always available; kept for route/UI gating call sites. */
export const isStorageConfigured: boolean = true;

export type UploadOptions = {
	altText?: string | null;
	uploadedBy?: string | null;
};

/** Validate + resize/compress to WebP/AVIF (smaller wins) + write to disk + persist a `media` row. */
export async function uploadImage(file: File, options: UploadOptions = {}): Promise<Media> {
	if (file.size === 0) throw AppError.validation('Empty file');
	if (file.size > MAX_IMAGE_BYTES) throw AppError.validation('Image exceeds maximum size (8 MB)');
	if (!isAllowedImageMime(file.type)) {
		throw AppError.validation(`Unsupported image type: ${file.type || 'unknown'}`);
	}

	const source = Buffer.from(await file.arrayBuffer());
	const processed = await processImage(source);

	const key = `images/${randomUUID()}.${processed.ext}`;
	const url = await putObject(key, processed.buffer);

	return mediaRepo.create({
		filename: key.split('/').pop() ?? key,
		originalName: file.name,
		mime: processed.mime,
		size: processed.buffer.byteLength,
		r2Key: key,
		url,
		altText: options.altText ?? null,
		width: processed.width,
		height: processed.height,
		uploadedBy: options.uploadedBy ?? null
	});
}

/** Validate + store a document as-is (no image processing) + persist a `media` row. */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<Media> {
	if (file.size === 0) throw AppError.validation('Empty file');
	if (file.size > MAX_FILE_BYTES) throw AppError.validation('File exceeds maximum size (25 MB)');
	if (!isAllowedFileMime(file.type)) {
		throw AppError.validation(`Unsupported file type: ${file.type || 'unknown'}`);
	}

	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	const key = `files/${randomUUID()}-${safeName}`;
	const buffer = Buffer.from(await file.arrayBuffer());
	const url = await putObject(key, buffer);

	return mediaRepo.create({
		filename: safeName,
		originalName: file.name,
		mime: file.type,
		size: buffer.byteLength,
		r2Key: key,
		url,
		altText: options.altText ?? null,
		width: null,
		height: null,
		uploadedBy: options.uploadedBy ?? null
	});
}

/** Delete the stored file and the `media` row together (explicit: no orphans). */
export async function deleteMedia(id: string): Promise<void> {
	const item = await mediaRepo.getById(id);
	if (!item) throw AppError.notFound('Media not found');

	await deleteObject(item.r2Key);
	await mediaRepo.remove(id);
}

/** Read a stored object (with its mime) for the public serving route. */
export async function getObject(key: string): Promise<{ buffer: Buffer; mime: string } | null> {
	const item = await mediaRepo.getByKey(key);
	if (!item) return null;
	const buffer = await readObject(item.r2Key);
	if (!buffer) return null;
	return { buffer, mime: item.mime };
}
