import { z } from 'zod';

/** Server-side upload constraints (PRD §9): explicit whitelist, max size. */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB (documents/downloads)

/** Accepted source image MIME types (converted to WebP on upload). */
export const ALLOWED_IMAGE_MIME = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/avif',
	'image/gif'
] as const;

/** Accepted document MIME types for the downloads feature. */
export const ALLOWED_FILE_MIME = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/zip'
] as const;

export const uploadImageSchema = z.object({
	altText: z.string().trim().max(255).optional()
});
export type UploadImageInput = z.infer<typeof uploadImageSchema>;

export function isAllowedImageMime(mime: string): boolean {
	return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}

export function isAllowedFileMime(mime: string): boolean {
	return (ALLOWED_FILE_MIME as readonly string[]).includes(mime);
}
