import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/storage', () => ({
	isStorageConfigured: true,
	uploadImage: vi.fn(),
	uploadFile: vi.fn(),
	deleteMedia: vi.fn()
}));
vi.mock('$lib/server/repositories/media.repository');

import * as storage from '$lib/server/storage';
import * as mediaRepo from '$lib/server/repositories/media.repository';
import * as mediaService from '$lib/server/services/media.service';
import type { Media } from '$lib/db/schema';

const ADMIN = { id: 'admin', role: 'ADMIN' as const };
const EDITOR = { id: 'editor', role: 'EDITOR' as const };
const STAFF = { id: 'staff', role: 'STAFF' as const };

function media(overrides: Partial<Media> = {}): Media {
	return {
		id: 'm1',
		filename: 'x.webp',
		originalName: 'x.png',
		mime: 'image/webp',
		size: 100,
		r2Key: 'images/x.webp',
		url: 'https://cdn.example.com/images/x.webp',
		altText: null,
		width: 10,
		height: 10,
		uploadedBy: EDITOR.id,
		createdAt: new Date(),
		...overrides
	} as Media;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe('media.service.uploadImage', () => {
	const file = new File(['data'], 'photo.png', { type: 'image/png' });

	it('rejects STAFF', async () => {
		await expect(mediaService.uploadImage(STAFF, file)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(storage.uploadImage).not.toHaveBeenCalled();
	});

	it('uploads for ADMIN, tagging the uploader', async () => {
		vi.mocked(storage.uploadImage).mockResolvedValue(media());
		await mediaService.uploadImage(ADMIN, file, 'Foto kegiatan');
		expect(storage.uploadImage).toHaveBeenCalledWith(file, {
			altText: 'Foto kegiatan',
			uploadedBy: ADMIN.id
		});
	});
});

describe('media.service.deleteMedia', () => {
	it('lets EDITOR delete their own media', async () => {
		vi.mocked(mediaRepo.getById).mockResolvedValue(media({ uploadedBy: EDITOR.id }));
		await mediaService.deleteMedia(EDITOR, 'm1');
		expect(storage.deleteMedia).toHaveBeenCalledWith('m1');
	});

	it('rejects EDITOR deleting someone else’s media', async () => {
		vi.mocked(mediaRepo.getById).mockResolvedValue(media({ uploadedBy: 'other' }));
		await expect(mediaService.deleteMedia(EDITOR, 'm1')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(storage.deleteMedia).not.toHaveBeenCalled();
	});

	it('throws NOT_FOUND for a missing media id', async () => {
		vi.mocked(mediaRepo.getById).mockResolvedValue(undefined);
		await expect(mediaService.deleteMedia(ADMIN, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
	});
});

describe('media.service.getMediaUrl', () => {
	it('returns null for a nullish id', async () => {
		expect(await mediaService.getMediaUrl(null)).toBeNull();
		expect(await mediaService.getMediaUrl(undefined)).toBeNull();
		expect(mediaRepo.getById).not.toHaveBeenCalled();
	});

	it('returns the stored url when found', async () => {
		vi.mocked(mediaRepo.getById).mockResolvedValue(media());
		expect(await mediaService.getMediaUrl('m1')).toBe('https://cdn.example.com/images/x.webp');
	});
});

describe('media.service.getMediaUrls', () => {
	it('resolves unique media ids in one repository call', async () => {
		vi.mocked(mediaRepo.getByIds).mockResolvedValue([
			media({ id: 'm1', url: '/uploads/images/one.webp' }),
			media({ id: 'm2', url: '/uploads/images/two.webp' })
		]);

		await expect(mediaService.getMediaUrls(['m1', undefined, 'm1', 'm2'])).resolves.toEqual({
			m1: '/uploads/images/one.webp',
			m2: '/uploads/images/two.webp'
		});
		expect(mediaRepo.getByIds).toHaveBeenCalledWith(['m1', 'm2']);
	});
});

describe('media.service.listMedia', () => {
	it('rejects STAFF', async () => {
		await expect(mediaService.listMedia(STAFF)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(mediaRepo.listRecent).not.toHaveBeenCalled();
		expect(mediaRepo.listByUploader).not.toHaveBeenCalled();
	});

	it('returns recent media for ADMIN', async () => {
		vi.mocked(mediaRepo.listRecent).mockResolvedValue([media()]);
		const result = await mediaService.listMedia(ADMIN);
		expect(result).toHaveLength(1);
		expect(mediaRepo.listRecent).toHaveBeenCalledWith(200);
	});

	it('returns uploader media for EDITOR by default', async () => {
		vi.mocked(mediaRepo.listByUploader).mockResolvedValue([media()]);
		const result = await mediaService.listMedia(EDITOR);
		expect(result).toHaveLength(1);
		expect(mediaRepo.listByUploader).toHaveBeenCalledWith(EDITOR.id, 200);
	});

	it('returns all recent media when options.all is true', async () => {
		vi.mocked(mediaRepo.listRecent).mockResolvedValue([media(), media({ id: 'm2' })]);
		const result = await mediaService.listMedia(EDITOR, { all: true, limit: 100 });
		expect(result).toHaveLength(2);
		expect(mediaRepo.listRecent).toHaveBeenCalledWith(100);
	});
});
