import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as pagesRepo from '$lib/server/repositories/pages.repository';
import * as pagesService from '$lib/server/services/pages.service';
import type { CreatePageInput } from '$lib/server/validators/pages';

vi.mock('$lib/server/repositories/pages.repository');

const ADMIN = { id: 'admin-1', role: 'ADMIN' as const };
const EDITOR = { id: 'editor-1', role: 'EDITOR' as const };
const STAFF = { id: 'staff-1', role: 'STAFF' as const };

function baseInput(overrides: Partial<CreatePageInput> = {}): CreatePageInput {
	return {
		title: 'Profil Sekolah',
		slug: undefined,
		content: '<p>Visi dan Misi SMK</p>',
		published: true,
		...overrides
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(pagesRepo.slugExists).mockResolvedValue(false);
	vi.mocked(pagesRepo.create).mockImplementation(async (data) => ({
		id: 'page-1',
		createdAt: new Date(),
		updatedAt: new Date(),
		title: data.title,
		slug: data.slug,
		content: data.content,
		published: data.published ?? false
	}));
	vi.mocked(pagesRepo.getById).mockImplementation(async (id) => ({
		id,
		title: 'Profil Sekolah',
		slug: 'profil-sekolah',
		content: '<p>Visi dan Misi SMK</p>',
		published: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}));
	vi.mocked(pagesRepo.update).mockImplementation(async (id, data) => ({
		id,
		title: data.title ?? 'Profil Sekolah',
		slug: data.slug ?? 'profil-sekolah',
		content: data.content ?? '<p>Visi dan Misi SMK</p>',
		published: data.published ?? true,
		createdAt: new Date(),
		updatedAt: new Date()
	}));
	vi.mocked(pagesRepo.remove).mockImplementation(async (id) => ({
		id,
		title: 'Profil Sekolah',
		slug: 'profil-sekolah',
		content: '<p>Visi dan Misi SMK</p>',
		published: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}));
});

describe('pages.service.createPage', () => {
	it('allows ADMIN to create a page with rich text content', async () => {
		const created = await pagesService.createPage(ADMIN, baseInput());
		expect(created.title).toBe('Profil Sekolah');
		expect(created.slug).toBe('profil-sekolah');
		expect(created.content).toBe('<p>Visi dan Misi SMK</p>');
		expect(pagesRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Profil Sekolah',
				slug: 'profil-sekolah',
				content: '<p>Visi dan Misi SMK</p>',
				published: true
			})
		);
	});

	it('allows EDITOR to create a page', async () => {
		const created = await pagesService.createPage(EDITOR, baseInput());
		expect(created.id).toBe('page-1');
	});

	it('rejects STAFF from creating a page', async () => {
		await expect(pagesService.createPage(STAFF, baseInput())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});

describe('pages.service.updatePage', () => {
	it('allows ADMIN to update a page', async () => {
		const updated = await pagesService.updatePage(ADMIN, 'page-1', {
			...baseInput(),
			title: 'Profil Sekolah Baru'
		});
		expect(updated.title).toBe('Profil Sekolah Baru');
	});

	it('rejects STAFF from updating a page', async () => {
		await expect(pagesService.updatePage(STAFF, 'page-1', baseInput())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});

describe('pages.service.deletePage', () => {
	it('allows ADMIN to delete a page', async () => {
		await pagesService.deletePage(ADMIN, 'page-1');
		expect(pagesRepo.remove).toHaveBeenCalledWith('page-1');
	});

	it('rejects STAFF from deleting a page', async () => {
		await expect(pagesService.deletePage(STAFF, 'page-1')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});
});
