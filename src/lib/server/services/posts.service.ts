import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import { buildExcerpt, sanitizePostHtml } from '$lib/server/html';
import { slugify } from '$lib/utils/slug';
import * as postsRepo from '$lib/server/repositories/posts.repository';
import * as tagsRepo from '$lib/server/repositories/tags.repository';
import * as categoriesRepo from '$lib/server/repositories/categories.repository';
import type { CreatePostInput, PostListQuery, UpdatePostInput } from '$lib/server/validators/posts';
import type { Category, NewPost, Post } from '$lib/db/schema';

/** Acting user for permission + ownership checks. */
export type Actor = { id: string; role: Role };

/** Number of posts per page in the admin list. */
export const ADMIN_PAGE_SIZE = 10;

/** Paginated result wrapper for admin listings. */
export type PaginatedPosts = {
	items: postsRepo.PostListItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
	/** Per-tab counts for the Blogger-style status tabs. */
	counts: StatusCounts;
};

/** Counts shown on the admin list tabs (Semua/Diterbitkan/Draf/Arsip/Sampah). */
export type StatusCounts = {
	all: number;
	published: number;
	draft: number;
	archived: number;
	trash: number;
};

/** Resolve a unique slug from a preferred value (or the title), avoiding collisions. */
async function resolveSlug(preferred: string | undefined, title: string, exceptId?: string) {
	const base = slugify(preferred || title) || 'post';
	let candidate = base;
	let n = 2;
	while (await postsRepo.slugExists(candidate, exceptId)) {
		candidate = `${base}-${n}`;
		n += 1;
	}
	return candidate;
}

/** Turn a comma-separated list of tag names into tag ids, creating missing tags. */
async function resolveTagIds(raw: string): Promise<string[]> {
	const names = Array.from(
		new Set(
			raw
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		)
	);
	if (!names.length) return [];

	const bySlug = new Map(names.map((name) => [slugify(name), name] as const));
	const slugs = Array.from(bySlug.keys()).filter(Boolean);
	if (!slugs.length) return [];

	const existing = await tagsRepo.getBySlugs(slugs);
	const existingSlugs = new Set(existing.map((t) => t.slug));

	const toCreate = slugs
		.filter((slug) => !existingSlugs.has(slug))
		.map((slug) => ({ name: bySlug.get(slug)!, slug }));
	const created = await tagsRepo.createMany(toCreate);

	return [...existing, ...created].map((t) => t.id);
}

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

/** Parse a datetime-local string into a Date; returns undefined when empty/invalid. */
function parsePublishedAt(value?: string): Date | undefined {
	const trimmed = value?.trim();
	if (!trimmed) return undefined;
	const date = new Date(trimmed);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format a Date as a `datetime-local` input value (YYYY-MM-DDTHH:mm), or '' when null. */
function toDatetimeLocal(date: Date | null): string {
	if (!date) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
		date.getHours()
	)}:${pad(date.getMinutes())}`;
}

/** Derive the excerpt to persist: manual value if provided, otherwise auto from content. */
function resolveExcerpt(manual: string | undefined, contentHtml: string): string | null {
	const trimmed = manual?.trim();
	if (trimmed) return trimmed;
	const auto = buildExcerpt(contentHtml);
	return auto || null;
}

export async function listPosts(actor: Actor, query?: PostListQuery): Promise<PaginatedPosts> {
	if (!can(actor.role, 'read', 'posts')) throw AppError.forbidden();

	const page = Math.max(1, query?.page ?? 1);
	const pageSize = ADMIN_PAGE_SIZE;
	const trashView = query?.status === 'TRASH';
	const filters: postsRepo.ListOptions = {
		status: query?.status === 'TRASH' ? undefined : query?.status,
		onlyDeleted: trashView,
		categoryId: query?.categoryId,
		search: query?.q?.trim() || undefined
	};

	const countBase = { categoryId: filters.categoryId, search: filters.search };
	const [items, total, published, draft, archived, trash] = await Promise.all([
		postsRepo.list({ ...filters, limit: pageSize, offset: (page - 1) * pageSize }),
		postsRepo.count(filters),
		postsRepo.count({ ...countBase, status: 'PUBLISHED' }),
		postsRepo.count({ ...countBase, status: 'DRAFT' }),
		postsRepo.count({ ...countBase, status: 'ARCHIVED' }),
		postsRepo.count({ ...countBase, onlyDeleted: true })
	]);

	const counts: StatusCounts = {
		all: published + draft + archived,
		published,
		draft,
		archived,
		trash
	};

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
		counts
	};
}

/** Categories available for the post form (read requires post read access). */
export async function listCategories(actor: Actor): Promise<Category[]> {
	if (!can(actor.role, 'read', 'posts')) throw AppError.forbidden();
	return categoriesRepo.listAll();
}

/** Fetch a post (with tag ids) for editing, enforcing update permission/ownership. */
export async function getPostForEdit(
	actor: Actor,
	id: string
): Promise<Post & { tagIds: string[] }> {
	const post = await postsRepo.getByIdWithTags(id);
	if (!post) throw AppError.notFound('Post tidak ditemukan');
	if (!can(actor.role, 'update', 'posts', { userId: actor.id, ownerId: post.authorId })) {
		throw AppError.forbidden();
	}
	return post;
}

/** Form-ready view of a post: values mapped to the create/update schema shape. */
export async function getPostFormData(
	actor: Actor,
	id: string
): Promise<CreatePostInput & { id: string }> {
	const post = await getPostForEdit(actor, id);
	const tags = await tagsRepo.getByIds(post.tagIds);
	return {
		id: post.id,
		title: post.title,
		slug: post.slug,
		content: post.content,
		excerpt: post.excerpt ?? '',
		categoryId: post.categoryId ?? undefined,
		status: post.status,
		isPinned: post.isPinned,
		publishedAt: toDatetimeLocal(post.publishedAt),
		tags: tags.map((t) => t.name).join(', '),
		seoTitle: post.seoTitle ?? '',
		seoDescription: post.seoDescription ?? '',
		seoKeywords: post.seoKeywords ?? '',
		thumbnailMediaId: post.thumbnailMediaId ?? undefined
	};
}

export async function createPost(actor: Actor, input: CreatePostInput): Promise<Post> {
	if (!can(actor.role, 'create', 'posts')) throw AppError.forbidden();

	if (input.status === 'PUBLISHED') {
		if (!can(actor.role, 'publish', 'posts', { userId: actor.id, ownerId: actor.id })) {
			throw AppError.forbidden('Anda tidak dapat mempublikasikan post');
		}
	}

	const slug = await resolveSlug(input.slug, input.title);
	const tagIds = await resolveTagIds(input.tags);
	const content = sanitizePostHtml(input.content);
	const manualPublishedAt = parsePublishedAt(input.publishedAt);

	const data: NewPost = {
		title: input.title,
		slug,
		content,
		excerpt: resolveExcerpt(input.excerpt, content),
		categoryId: input.categoryId ?? null,
		thumbnailMediaId: input.thumbnailMediaId ?? null,
		authorId: actor.id,
		status: input.status,
		isPinned: input.isPinned ?? false,
		seoTitle: emptyToNull(input.seoTitle),
		seoDescription: emptyToNull(input.seoDescription),
		seoKeywords: emptyToNull(input.seoKeywords),
		publishedAt: manualPublishedAt ?? (input.status === 'PUBLISHED' ? new Date() : null)
	};

	return postsRepo.create(data, tagIds);
}

export async function updatePost(actor: Actor, id: string, input: UpdatePostInput): Promise<Post> {
	const existing = await postsRepo.getById(id);
	if (!existing) throw AppError.notFound('Post tidak ditemukan');

	const ownership = { userId: actor.id, ownerId: existing.authorId };
	if (!can(actor.role, 'update', 'posts', ownership)) throw AppError.forbidden();

	const publishing = input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
	if (publishing && !can(actor.role, 'publish', 'posts', ownership)) {
		throw AppError.forbidden('Anda tidak dapat mempublikasikan post');
	}

	const slug = await resolveSlug(input.slug, input.title, id);
	const tagIds = await resolveTagIds(input.tags);
	const content = sanitizePostHtml(input.content);
	const manualPublishedAt = parsePublishedAt(input.publishedAt);

	// Resolve the publish date: explicit manual value wins; otherwise preserve the original
	// and only stamp `now` on the first publish.
	let publishedAt: Date | null;
	if (manualPublishedAt) {
		publishedAt = manualPublishedAt;
	} else if (input.status === 'PUBLISHED') {
		publishedAt = existing.publishedAt ?? new Date();
	} else {
		publishedAt = existing.publishedAt;
	}

	const data: Partial<Omit<NewPost, 'id'>> = {
		title: input.title,
		slug,
		content,
		excerpt: resolveExcerpt(input.excerpt, content),
		categoryId: input.categoryId ?? null,
		thumbnailMediaId: input.thumbnailMediaId ?? null,
		status: input.status,
		isPinned: input.isPinned ?? false,
		seoTitle: emptyToNull(input.seoTitle),
		seoDescription: emptyToNull(input.seoDescription),
		seoKeywords: emptyToNull(input.seoKeywords),
		publishedAt
	};

	const updated = await postsRepo.update(id, data, tagIds);
	if (!updated) throw AppError.notFound('Post tidak ditemukan');
	return updated;
}

export async function deletePost(actor: Actor, id: string): Promise<void> {
	const existing = await postsRepo.getById(id);
	if (!existing) throw AppError.notFound('Post tidak ditemukan');

	if (!can(actor.role, 'delete', 'posts', { userId: actor.id, ownerId: existing.authorId })) {
		throw AppError.forbidden();
	}

	await postsRepo.softDelete(id);
}

/** Restore a post from the trash (clear `deletedAt`). */
export async function restorePost(actor: Actor, id: string): Promise<void> {
	const existing = await postsRepo.getByIdIncludingDeleted(id);
	if (!existing || !existing.deletedAt) throw AppError.notFound('Post tidak ada di sampah');

	if (!can(actor.role, 'update', 'posts', { userId: actor.id, ownerId: existing.authorId })) {
		throw AppError.forbidden();
	}

	await postsRepo.restore(id);
}

/** Permanently delete a post — only allowed from the trash (explicit hard delete). */
export async function deletePostPermanently(actor: Actor, id: string): Promise<void> {
	const existing = await postsRepo.getByIdIncludingDeleted(id);
	if (!existing || !existing.deletedAt) throw AppError.notFound('Post tidak ada di sampah');

	if (!can(actor.role, 'delete', 'posts', { userId: actor.id, ownerId: existing.authorId })) {
		throw AppError.forbidden();
	}

	await postsRepo.hardDelete(id);
}

/**
 * Soft-delete multiple posts (admin bulk action). Each post is permission-checked; only the
 * ones the actor may delete are removed. Returns the number actually deleted.
 */
export async function bulkDeletePosts(actor: Actor, ids: string[]): Promise<number> {
	// Coarse guard: reject roles that can never delete posts (STAFF). ADMIN and EDITOR pass;
	// per-post ownership is then enforced below.
	if (!can(actor.role, 'delete', 'posts', { userId: actor.id, ownerId: actor.id })) {
		throw AppError.forbidden();
	}

	const unique = Array.from(new Set(ids.filter(Boolean)));
	if (!unique.length) return 0;

	const existing = await Promise.all(unique.map((id) => postsRepo.getById(id)));
	const deletable = existing
		.filter((post): post is NonNullable<typeof post> => Boolean(post))
		.filter((post) =>
			can(actor.role, 'delete', 'posts', { userId: actor.id, ownerId: post.authorId })
		)
		.map((post) => post.id);

	return postsRepo.bulkSoftDelete(deletable);
}

/** Toggle the pinned/featured-on-homepage flag for a post. */
export async function setPinned(actor: Actor, id: string, pinned: boolean): Promise<void> {
	const existing = await postsRepo.getById(id);
	if (!existing) throw AppError.notFound('Post tidak ditemukan');

	if (!can(actor.role, 'update', 'posts', { userId: actor.id, ownerId: existing.authorId })) {
		throw AppError.forbidden();
	}

	await postsRepo.setPinned(id, pinned);
}
