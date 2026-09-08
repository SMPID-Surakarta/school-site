import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/repositories/galleries.repository');

import type { Gallery, GalleryPhoto } from '$lib/db/schema';
import * as galleriesRepo from '$lib/server/repositories/galleries.repository';
import * as galleriesService from '$lib/server/services/galleries.service';
import type { CreateGalleryInput } from '$lib/server/validators/galleries';

const ADMIN = { id: 'admin', role: 'ADMIN' as const };
const STAFF = { id: 'staff', role: 'STAFF' as const };
const PHOTO_A = '11111111-1111-4111-8111-111111111111';
const PHOTO_B = '22222222-2222-4222-8222-222222222222';

function gallery(overrides: Partial<Gallery> = {}): Gallery {
	return {
		id: 'gallery-1',
		title: 'Class Meeting',
		eventDate: new Date('2026-06-10T00:00:00.000Z'),
		description: 'Lomba antar kelas',
		coverMediaId: PHOTO_A,
		imageMediaId: null,
		category: null,
		createdAt: new Date('2026-06-10T00:00:00.000Z'),
		updatedAt: new Date('2026-06-10T00:00:00.000Z'),
		deletedAt: null,
		...overrides
	};
}

function photo(overrides: Partial<GalleryPhoto> = {}): GalleryPhoto {
	return {
		id: 'photo-1',
		galleryId: 'gallery-1',
		mediaId: PHOTO_A,
		orderIndex: 0,
		createdAt: new Date('2026-06-10T00:00:00.000Z'),
		...overrides
	};
}

function input(overrides: Partial<CreateGalleryInput> = {}): CreateGalleryInput {
	return {
		title: 'Class Meeting',
		eventDate: '2026-06-10',
		description: '',
		coverMediaId: PHOTO_A,
		photoMediaIds: [PHOTO_A, PHOTO_B],
		...overrides
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(galleriesRepo.createWithPhotos).mockResolvedValue(gallery());
	vi.mocked(galleriesRepo.update).mockResolvedValue(gallery());
});

describe('galleries.service', () => {
	it('creates an album with event date, cover, and unique photos', async () => {
		await galleriesService.createGallery(
			ADMIN,
			input({ photoMediaIds: [PHOTO_A, PHOTO_A, PHOTO_B] })
		);

		expect(galleriesRepo.createWithPhotos).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Class Meeting',
				eventDate: new Date('2026-06-10T00:00:00.000Z'),
				description: null,
				coverMediaId: PHOTO_A
			}),
			[PHOTO_A, PHOTO_B]
		);
	});

	it('rejects a cover that is not part of the album photos', async () => {
		await expect(
			galleriesService.createGallery(
				ADMIN,
				input({ coverMediaId: '33333333-3333-4333-8333-333333333333' })
			)
		).rejects.toMatchObject({ code: 'VALIDATION' });
		expect(galleriesRepo.createWithPhotos).not.toHaveBeenCalled();
	});

	it('keeps STAFF read-only for gallery albums', async () => {
		vi.mocked(galleriesRepo.listAlbums).mockResolvedValue([]);
		await expect(galleriesService.listGalleries(STAFF)).resolves.toEqual([]);
		await expect(galleriesService.createGallery(STAFF, input())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('moves the cover to the next photo when deleting the current cover photo', async () => {
		vi.mocked(galleriesRepo.getAlbumById).mockResolvedValue({
			...gallery(),
			coverUrl: '/uploads/a.avif',
			coverAltText: null,
			coverWidth: 100,
			coverHeight: 100,
			photoCount: 2,
			photos: [
				{ ...photo(), url: '/uploads/a.avif', altText: null, width: 100, height: 100 },
				{
					...photo({ id: 'photo-2', mediaId: PHOTO_B, orderIndex: 1 }),
					url: '/uploads/b.avif',
					altText: null,
					width: 100,
					height: 100
				}
			]
		});
		vi.mocked(galleriesRepo.getPhoto).mockResolvedValue(photo());
		vi.mocked(galleriesRepo.removePhoto).mockResolvedValue(photo());
		vi.mocked(galleriesRepo.listPhotos).mockResolvedValue([
			{
				...photo({ id: 'photo-2', mediaId: PHOTO_B, orderIndex: 1 }),
				url: '/uploads/b.avif',
				altText: null,
				width: 100,
				height: 100
			}
		]);

		await galleriesService.removeGalleryPhoto(ADMIN, 'gallery-1', 'photo-1');

		expect(galleriesRepo.update).toHaveBeenCalledWith('gallery-1', { coverMediaId: PHOTO_B });
	});
});
