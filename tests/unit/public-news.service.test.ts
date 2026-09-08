import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({ db: {} }));
vi.mock('$lib/server/services/whatsapp.service', () => ({ forwardContactToWhatsApp: vi.fn() }));
vi.mock('$lib/server/repositories/posts.repository');
vi.mock('$lib/server/repositories/categories.repository');
vi.mock('$lib/server/repositories/tags.repository');

import * as postsRepo from '$lib/server/repositories/posts.repository';
import * as categoriesRepo from '$lib/server/repositories/categories.repository';
import * as tagsRepo from '$lib/server/repositories/tags.repository';
import { getNewsBySlug, listNews, PAGE_SIZE } from '$lib/server/services/public.service';
import { publicNewsSearchSchema } from '$lib/server/validators/public-news';

type PublishedPost = NonNullable<Awaited<ReturnType<typeof postsRepo.getPublishedBySlug>>>;

const category = { id: '11111111-1111-4111-8111-111111111111', name: 'Kegiatan', slug: 'kegiatan' };
const post: PublishedPost = {
	id: 'post-1',
	title: 'Kegiatan Sekolah',
	slug: 'kegiatan-sekolah',
	content: '<p>Berita sekolah</p><script>alert(1)</script>',
	excerpt: null,
	thumbnailMediaId: null,
	thumbnailUrl: '/uploads/images/kegiatan.webp',
	thumbnailAltText: '  Praktik di bengkel sekolah  ',
	thumbnailWidth: 1200,
	thumbnailHeight: 800,
	authorId: null,
	authorName: null,
	categoryId: category.id,
	categoryName: category.name,
	seoTitle: null,
	seoDescription: null,
	seoKeywords: null,
	ogImage: null,
	status: 'PUBLISHED',
	isPinned: false,
	viewCount: 0,
	searchVector: null,
	publishedAt: new Date('2026-09-01'),
	createdAt: new Date('2026-09-01'),
	updatedAt: new Date('2026-09-01'),
	deletedAt: null
};

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(postsRepo.getPublishedBySlug).mockResolvedValue(post);
	vi.mocked(postsRepo.listRelated).mockResolvedValue([]);
	vi.mocked(categoriesRepo.listAll).mockResolvedValue([category]);
	vi.mocked(tagsRepo.listForPost).mockResolvedValue([
		{ id: 'tag-1', name: 'Praktik', slug: 'praktik' }
	]);
});

describe('public news detail', () => {
	it('loads four related posts excluding the current post and preserves sanitized content', async () => {
		const related = {
			id: 'post-2',
			title: 'Berita terkait',
			slug: 'berita-terkait',
			excerpt: null,
			categoryName: category.name,
			thumbnailUrl: null,
			thumbnailAltText: null,
			thumbnailWidth: null,
			thumbnailHeight: null,
			publishedAt: new Date('2026-08-31')
		};
		vi.mocked(postsRepo.listRelated).mockResolvedValue([related]);
		const result = await getNewsBySlug(post.slug);
		expect(postsRepo.listRelated).toHaveBeenCalledWith(category.id, post.id, 4);
		expect(postsRepo.incrementViewCount).toHaveBeenCalledWith(post.id);
		expect(result).toMatchObject({
			relatedPosts: [related],
			categories: [category],
			imageCaption: 'Praktik di bengkel sekolah',
			tags: [{ name: 'Praktik' }]
		});
		expect(result?.contentHtml).toContain('<p>Berita sekolah</p>');
		expect(result?.contentHtml).not.toContain('<script>');
	});

	it('does not substitute unrelated posts when there is no category or image caption', async () => {
		vi.mocked(postsRepo.getPublishedBySlug).mockResolvedValue({
			...post,
			categoryId: null,
			thumbnailAltText: null
		});
		const result = await getNewsBySlug(post.slug);
		expect(postsRepo.listRelated).not.toHaveBeenCalled();
		expect(result).toMatchObject({ relatedPosts: [], imageCaption: '' });
	});

	it('does not load sidebar data or count views for missing or unpublished posts', async () => {
		vi.mocked(postsRepo.getPublishedBySlug).mockResolvedValue(undefined);
		expect(await getNewsBySlug('missing')).toBeUndefined();
		expect(postsRepo.listRelated).not.toHaveBeenCalled();
		expect(postsRepo.incrementViewCount).not.toHaveBeenCalled();
		expect(categoriesRepo.listAll).not.toHaveBeenCalled();
		expect(tagsRepo.listForPost).not.toHaveBeenCalled();
	});
});

describe('public news navigation', () => {
	it('uses the same category filter for the list and its pagination count', async () => {
		vi.mocked(postsRepo.listPublished).mockResolvedValue([]);
		vi.mocked(postsRepo.countPublished).mockResolvedValue(12);
		vi.mocked(categoriesRepo.getById).mockResolvedValue(category);
		const result = await listNews('2', category.id);
		expect(postsRepo.listPublished).toHaveBeenCalledWith(PAGE_SIZE, PAGE_SIZE, category.id);
		expect(postsRepo.countPublished).toHaveBeenCalledWith(category.id);
		expect(result).toMatchObject({ page: 2, pageCount: 2, total: 12, category });
	});

	it('ignores invalid category IDs before querying', async () => {
		vi.mocked(postsRepo.listPublished).mockResolvedValue([]);
		vi.mocked(postsRepo.countPublished).mockResolvedValue(0);
		await listNews(null, 'invalid');
		expect(postsRepo.listPublished).toHaveBeenCalledWith(PAGE_SIZE, 0, undefined);
		expect(categoriesRepo.getById).not.toHaveBeenCalled();
	});

	it('trims search terms and rejects oversized queries', () => {
		expect(publicNewsSearchSchema.parse({ q: ' sekolah ' }).q).toBe('sekolah');
		expect(publicNewsSearchSchema.safeParse({ q: 'a'.repeat(201) }).success).toBe(false);
	});
});
