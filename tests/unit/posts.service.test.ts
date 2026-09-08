import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '$lib/server/errors';

vi.mock('$lib/server/repositories/posts.repository');
vi.mock('$lib/server/repositories/tags.repository');
vi.mock('$lib/server/repositories/categories.repository');

import * as postsRepo from '$lib/server/repositories/posts.repository';
import * as tagsRepo from '$lib/server/repositories/tags.repository';
import * as postsService from '$lib/server/services/posts.service';
import { createPostSchema } from '$lib/server/validators/posts';
import type { CreatePostInput } from '$lib/server/validators/posts';

const ADMIN = { id: 'admin-1', role: 'ADMIN' as const };
const EDITOR = { id: 'editor-1', role: 'EDITOR' as const };
const STAFF = { id: 'staff-1', role: 'STAFF' as const };

function baseInput(overrides: Partial<CreatePostInput> = {}): CreatePostInput {
	return {
		title: 'Judul Berita',
		slug: undefined,
		content: 'Isi konten',
		excerpt: '',
		categoryId: undefined,
		status: 'DRAFT',
		isPinned: false,
		publishedAt: undefined,
		tags: '',
		seoTitle: '',
		seoDescription: '',
		seoKeywords: '',
		thumbnailMediaId: undefined,
		...overrides
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(postsRepo.slugExists).mockResolvedValue(false);
	vi.mocked(tagsRepo.getBySlugs).mockResolvedValue([]);
	vi.mocked(tagsRepo.createMany).mockResolvedValue([]);
	vi.mocked(postsRepo.create).mockImplementation(
		async (data) => ({ id: 'post-1', ...data }) as never
	);
});

describe('posts.service.createPost', () => {
	it('rejects STAFF', async () => {
		await expect(postsService.createPost(STAFF, baseInput())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.create).not.toHaveBeenCalled();
	});

	it('lets EDITOR create a draft with generated slug and authorId', async () => {
		await postsService.createPost(EDITOR, baseInput({ title: 'Halo Dunia' }));
		expect(postsRepo.create).toHaveBeenCalledOnce();
		const [data] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(data.slug).toBe('halo-dunia');
		expect(data.authorId).toBe(EDITOR.id);
		expect(data.status).toBe('DRAFT');
		expect(data.publishedAt).toBeNull();
	});

	it('stamps publishedAt when EDITOR publishes own post', async () => {
		await postsService.createPost(EDITOR, baseInput({ status: 'PUBLISHED' }));
		const [data] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(data.status).toBe('PUBLISHED');
		expect(data.publishedAt).toBeInstanceOf(Date);
	});

	it('appends a numeric suffix when the slug already exists', async () => {
		vi.mocked(postsRepo.slugExists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		await postsService.createPost(ADMIN, baseInput({ title: 'Duplikat' }));
		const [data] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(data.slug).toBe('duplikat-2');
	});

	it('resolves comma-separated tags, creating missing ones', async () => {
		vi.mocked(tagsRepo.getBySlugs).mockResolvedValue([
			{ id: 'tag-a', name: 'Sekolah', slug: 'sekolah' }
		]);
		vi.mocked(tagsRepo.createMany).mockResolvedValue([
			{ id: 'tag-b', name: 'Prestasi', slug: 'prestasi' }
		]);
		await postsService.createPost(ADMIN, baseInput({ tags: 'Sekolah, Prestasi' }));
		expect(tagsRepo.createMany).toHaveBeenCalledWith([{ name: 'Prestasi', slug: 'prestasi' }]);
		const [, tagIds] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(tagIds).toEqual(['tag-a', 'tag-b']);
	});
});

describe('posts.service.updatePost', () => {
	it('rejects EDITOR editing another author’s post', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue({
			id: 'post-9',
			authorId: 'someone-else',
			status: 'DRAFT',
			publishedAt: null
		} as never);
		await expect(postsService.updatePost(EDITOR, 'post-9', baseInput())).rejects.toBeInstanceOf(
			AppError
		);
		expect(postsRepo.update).not.toHaveBeenCalled();
	});

	it('throws NOT_FOUND when the post does not exist', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue(undefined);
		await expect(postsService.updatePost(ADMIN, 'missing', baseInput())).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
	});
});

describe('posts.service.deletePost', () => {
	it('soft-deletes when EDITOR owns the post', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue({
			id: 'post-1',
			authorId: EDITOR.id
		} as never);
		vi.mocked(postsRepo.softDelete).mockResolvedValue({ id: 'post-1' } as never);
		await postsService.deletePost(EDITOR, 'post-1');
		expect(postsRepo.softDelete).toHaveBeenCalledWith('post-1');
	});

	it('rejects EDITOR deleting another author’s post', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue({
			id: 'post-2',
			authorId: 'other'
		} as never);
		await expect(postsService.deletePost(EDITOR, 'post-2')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.softDelete).not.toHaveBeenCalled();
	});
});

describe('posts.service.bulkDeletePosts', () => {
	it('lets ADMIN soft-delete every selected post', async () => {
		vi.mocked(postsRepo.getById).mockImplementation(
			async (id) => ({ id, authorId: 'anyone' }) as never
		);
		vi.mocked(postsRepo.bulkSoftDelete).mockResolvedValue(2);

		const count = await postsService.bulkDeletePosts(ADMIN, ['a', 'b']);

		expect(count).toBe(2);
		expect(postsRepo.bulkSoftDelete).toHaveBeenCalledWith(['a', 'b']);
	});

	it('only deletes EDITOR-owned posts, skipping others', async () => {
		vi.mocked(postsRepo.getById).mockImplementation(
			async (id) => ({ id, authorId: id === 'own' ? EDITOR.id : 'other' }) as never
		);
		vi.mocked(postsRepo.bulkSoftDelete).mockResolvedValue(1);

		await postsService.bulkDeletePosts(EDITOR, ['own', 'other']);

		expect(postsRepo.bulkSoftDelete).toHaveBeenCalledWith(['own']);
	});

	it('rejects STAFF entirely', async () => {
		await expect(postsService.bulkDeletePosts(STAFF, ['a'])).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.bulkSoftDelete).not.toHaveBeenCalled();
	});
});

describe('posts.service.setPinned', () => {
	it('lets EDITOR pin their own post', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue({
			id: 'post-1',
			authorId: EDITOR.id
		} as never);
		vi.mocked(postsRepo.setPinned).mockResolvedValue({ id: 'post-1' } as never);

		await postsService.setPinned(EDITOR, 'post-1', true);

		expect(postsRepo.setPinned).toHaveBeenCalledWith('post-1', true);
	});

	it('rejects EDITOR pinning another author’s post', async () => {
		vi.mocked(postsRepo.getById).mockResolvedValue({
			id: 'post-2',
			authorId: 'other'
		} as never);
		await expect(postsService.setPinned(EDITOR, 'post-2', true)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.setPinned).not.toHaveBeenCalled();
	});
});

describe('posts.service.restorePost', () => {
	it('restores a trashed post the EDITOR owns', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-1',
			authorId: EDITOR.id,
			deletedAt: new Date()
		} as never);
		vi.mocked(postsRepo.restore).mockResolvedValue({ id: 'post-1' } as never);

		await postsService.restorePost(EDITOR, 'post-1');

		expect(postsRepo.restore).toHaveBeenCalledWith('post-1');
	});

	it('throws NOT_FOUND when the post is not in the trash', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-1',
			authorId: EDITOR.id,
			deletedAt: null
		} as never);
		await expect(postsService.restorePost(EDITOR, 'post-1')).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
		expect(postsRepo.restore).not.toHaveBeenCalled();
	});

	it('rejects EDITOR restoring another author’s post', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-2',
			authorId: 'other',
			deletedAt: new Date()
		} as never);
		await expect(postsService.restorePost(EDITOR, 'post-2')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.restore).not.toHaveBeenCalled();
	});
});

describe('posts.service.deletePostPermanently', () => {
	it('hard-deletes a trashed post for ADMIN', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-1',
			authorId: 'anyone',
			deletedAt: new Date()
		} as never);
		vi.mocked(postsRepo.hardDelete).mockResolvedValue(true);

		await postsService.deletePostPermanently(ADMIN, 'post-1');

		expect(postsRepo.hardDelete).toHaveBeenCalledWith('post-1');
	});

	it('refuses to hard-delete a post that is not in the trash', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-1',
			authorId: ADMIN.id,
			deletedAt: null
		} as never);
		await expect(postsService.deletePostPermanently(ADMIN, 'post-1')).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
		expect(postsRepo.hardDelete).not.toHaveBeenCalled();
	});

	it('rejects STAFF', async () => {
		vi.mocked(postsRepo.getByIdIncludingDeleted).mockResolvedValue({
			id: 'post-1',
			authorId: 'anyone',
			deletedAt: new Date()
		} as never);
		await expect(postsService.deletePostPermanently(STAFF, 'post-1')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(postsRepo.hardDelete).not.toHaveBeenCalled();
	});
});

describe('posts.service.listPosts trash view', () => {
	beforeEach(() => {
		vi.mocked(postsRepo.list).mockResolvedValue([]);
		vi.mocked(postsRepo.count).mockResolvedValue(0);
	});

	it('queries only soft-deleted posts when status is TRASH', async () => {
		await postsService.listPosts(ADMIN, { page: 1, q: '', status: 'TRASH' });
		const [opts] = vi.mocked(postsRepo.list).mock.calls[0];
		expect(opts?.onlyDeleted).toBe(true);
		expect(opts?.status).toBeUndefined();
	});

	it('returns per-status counts for the tabs', async () => {
		vi.mocked(postsRepo.count)
			.mockResolvedValueOnce(6) // total for the active filter
			.mockResolvedValueOnce(3) // published
			.mockResolvedValueOnce(2) // draft
			.mockResolvedValueOnce(1) // archived
			.mockResolvedValueOnce(4); // trash
		const result = await postsService.listPosts(ADMIN, { page: 1, q: '' });
		expect(result.counts).toEqual({ all: 6, published: 3, draft: 2, archived: 1, trash: 4 });
	});
});

describe('posts.service.createPost content handling', () => {
	it('sanitizes malicious HTML and auto-generates an excerpt', async () => {
		await postsService.createPost(
			ADMIN,
			baseInput({
				content: '<p>Halo <strong>dunia</strong></p><script>alert(1)</script>'
			})
		);
		const [data] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(data.content).not.toContain('<script>');
		expect(data.content).toContain('<strong>dunia</strong>');
		expect(data.excerpt).toBe('Halo dunia');
	});

	it('keeps a manual excerpt when provided', async () => {
		await postsService.createPost(
			ADMIN,
			baseInput({ content: '<p>Isi panjang</p>', excerpt: 'Ringkasan manual' })
		);
		const [data] = vi.mocked(postsRepo.create).mock.calls[0];
		expect(data.excerpt).toBe('Ringkasan manual');
	});
});

describe('createPostSchema content validation', () => {
	it('rejects empty Quill markup (<p><br></p>)', () => {
		const result = createPostSchema.safeParse({ title: 'Judul', content: '<p><br></p>' });
		expect(result.success).toBe(false);
	});

	it('accepts content with only an image embed', () => {
		const result = createPostSchema.safeParse({
			title: 'Judul',
			content: '<p><img src="/uploads/images/a.avif"></p>'
		});
		expect(result.success).toBe(true);
	});

	it('accepts normal text content', () => {
		const result = createPostSchema.safeParse({ title: 'Judul', content: '<p>Halo</p>' });
		expect(result.success).toBe(true);
	});
});
