import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/services/media.service');

import * as mediaService from '$lib/server/services/media.service';
import { GET } from '../../src/routes/(admin)/admin/api/media/+server';
import type { Media } from '$lib/db/schema';

function dummyMedia(overrides: Partial<Media> = {}): Media {
	return {
		id: 'm1',
		filename: 'pic.webp',
		originalName: 'Foto Sekolah.png',
		mime: 'image/webp',
		size: 1024,
		r2Key: 'images/pic.webp',
		url: '/uploads/images/pic.webp',
		altText: 'Gedung Sekolah',
		width: 800,
		height: 600,
		uploadedBy: 'u1',
		createdAt: new Date(),
		...overrides
	} as Media;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe('GET /admin/api/media', () => {
	it('throws 401 if unauthenticated', async () => {
		const event = {
			locals: { auth: vi.fn().mockResolvedValue(null) },
			url: new URL('http://localhost/admin/api/media')
		} as unknown as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({ status: 401 });
	});

	it('throws 403 if role cannot read media', async () => {
		const event = {
			locals: {
				auth: vi.fn().mockResolvedValue({
					user: { id: 'u1', role: 'STAFF' }
				})
			},
			url: new URL('http://localhost/admin/api/media')
		} as unknown as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({ status: 403 });
	});

	it('returns media items for ADMIN and EDITOR', async () => {
		vi.mocked(mediaService.listMedia).mockResolvedValue([
			dummyMedia(),
			dummyMedia({
				id: 'm2',
				originalName: 'Dokumen Panduan.pdf',
				mime: 'application/pdf',
				url: '/uploads/files/doc.pdf',
				altText: null
			})
		]);

		const event = {
			locals: {
				auth: vi.fn().mockResolvedValue({
					user: { id: 'u1', role: 'EDITOR' }
				})
			},
			url: new URL('http://localhost/admin/api/media')
		} as unknown as Parameters<typeof GET>[0];

		const response = await GET(event);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toHaveLength(2);
		expect(data[0]).toMatchObject({ id: 'm1', originalName: 'Foto Sekolah.png' });
	});

	it('filters by kind and search query', async () => {
		vi.mocked(mediaService.listMedia).mockResolvedValue([
			dummyMedia({ id: 'm1', originalName: 'Foto Sekolah.png', mime: 'image/webp' }),
			dummyMedia({ id: 'm2', originalName: 'Foto Lapangan.png', mime: 'image/webp' }),
			dummyMedia({ id: 'm3', originalName: 'Silabus.pdf', mime: 'application/pdf' })
		]);

		const event = {
			locals: {
				auth: vi.fn().mockResolvedValue({
					user: { id: 'u1', role: 'ADMIN' }
				})
			},
			url: new URL('http://localhost/admin/api/media?kind=image&q=lapangan')
		} as unknown as Parameters<typeof GET>[0];

		const response = await GET(event);
		const data = await response.json();
		expect(data).toHaveLength(1);
		expect(data[0].id).toBe('m2');
	});
});
