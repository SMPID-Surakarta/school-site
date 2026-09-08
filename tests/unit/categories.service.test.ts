import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/repositories/categories.repository');

import * as categoriesRepo from '$lib/server/repositories/categories.repository';
import * as categoriesService from '$lib/server/services/categories.service';

const ADMIN = { id: 'admin-1', role: 'ADMIN' as const };
const EDITOR = { id: 'editor-1', role: 'EDITOR' as const };
const STAFF = { id: 'staff-1', role: 'STAFF' as const };

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(categoriesRepo.slugExists).mockResolvedValue(false);
	vi.mocked(categoriesRepo.create).mockImplementation(
		async (data) => ({ id: 'cat-1', ...data }) as never
	);
});

describe('categories.service.listCategoriesWithCounts', () => {
	it('lets STAFF read the list', async () => {
		vi.mocked(categoriesRepo.listWithPostCounts).mockResolvedValue([
			{ id: 'cat-1', name: 'Pengumuman', slug: 'pengumuman', postCount: 3 }
		]);
		const result = await categoriesService.listCategoriesWithCounts(STAFF);
		expect(result).toHaveLength(1);
		expect(result[0].postCount).toBe(3);
	});
});

describe('categories.service.createCategory', () => {
	it('rejects STAFF', async () => {
		await expect(
			categoriesService.createCategory(STAFF, { name: 'Pengumuman', slug: undefined })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(categoriesRepo.create).not.toHaveBeenCalled();
	});

	it('lets EDITOR create with an auto-generated slug', async () => {
		await categoriesService.createCategory(EDITOR, { name: 'Berita Sekolah', slug: undefined });
		expect(categoriesRepo.create).toHaveBeenCalledWith({
			name: 'Berita Sekolah',
			slug: 'berita-sekolah'
		});
	});

	it('appends a numeric suffix when the slug already exists', async () => {
		vi.mocked(categoriesRepo.slugExists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		await categoriesService.createCategory(ADMIN, { name: 'Duplikat', slug: undefined });
		expect(categoriesRepo.create).toHaveBeenCalledWith({ name: 'Duplikat', slug: 'duplikat-2' });
	});
});

describe('categories.service.updateCategory', () => {
	it('renames an existing category', async () => {
		vi.mocked(categoriesRepo.getById).mockResolvedValue({
			id: 'cat-1',
			name: 'Lama',
			slug: 'lama'
		});
		vi.mocked(categoriesRepo.update).mockResolvedValue({
			id: 'cat-1',
			name: 'Baru',
			slug: 'baru'
		});

		const result = await categoriesService.updateCategory(ADMIN, 'cat-1', {
			name: 'Baru',
			slug: undefined
		});

		expect(categoriesRepo.update).toHaveBeenCalledWith('cat-1', { name: 'Baru', slug: 'baru' });
		expect(result.name).toBe('Baru');
	});

	it('throws NOT_FOUND for a missing category', async () => {
		vi.mocked(categoriesRepo.getById).mockResolvedValue(undefined);
		await expect(
			categoriesService.updateCategory(ADMIN, 'missing', { name: 'X', slug: undefined })
		).rejects.toMatchObject({ code: 'NOT_FOUND' });
		expect(categoriesRepo.update).not.toHaveBeenCalled();
	});

	it('rejects STAFF', async () => {
		await expect(
			categoriesService.updateCategory(STAFF, 'cat-1', { name: 'X', slug: undefined })
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});
});

describe('categories.service.deleteCategory', () => {
	it('deletes an existing category', async () => {
		vi.mocked(categoriesRepo.getById).mockResolvedValue({
			id: 'cat-1',
			name: 'Pengumuman',
			slug: 'pengumuman'
		});
		vi.mocked(categoriesRepo.remove).mockResolvedValue(true);

		await categoriesService.deleteCategory(ADMIN, 'cat-1');

		expect(categoriesRepo.remove).toHaveBeenCalledWith('cat-1');
	});

	it('throws NOT_FOUND for a missing category', async () => {
		vi.mocked(categoriesRepo.getById).mockResolvedValue(undefined);
		await expect(categoriesService.deleteCategory(ADMIN, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
		expect(categoriesRepo.remove).not.toHaveBeenCalled();
	});

	it('rejects STAFF', async () => {
		await expect(categoriesService.deleteCategory(STAFF, 'cat-1')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(categoriesRepo.remove).not.toHaveBeenCalled();
	});
});
