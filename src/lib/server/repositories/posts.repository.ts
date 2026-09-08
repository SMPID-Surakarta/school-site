import { and, desc, eq, ilike, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	categories,
	media,
	posts,
	postTags,
	users,
	type NewPost,
	type Post,
	type PostStatus
} from '$lib/db/schema';

/**
 * Posts repository — the only place allowed to run Drizzle queries for the `posts`
 * (and `post_tags`) tables. Pure CRUD/query, no business logic or permission checks.
 * List queries filter out soft-deleted rows unless `includeDeleted` is set.
 */

/** Shape returned by {@link list}: post columns plus resolved author/category names. */
export type PostListItem = {
	id: string;
	title: string;
	slug: string;
	status: PostStatus;
	isPinned: boolean;
	viewCount: number;
	authorId: string | null;
	authorName: string | null;
	categoryId: string | null;
	categoryName: string | null;
	publishedAt: Date | null;
	updatedAt: Date;
	deletedAt: Date | null;
};

export type ListOptions = {
	status?: PostStatus;
	authorId?: string;
	categoryId?: string;
	search?: string;
	includeDeleted?: boolean;
	/** Only soft-deleted rows (admin trash view). Overrides `includeDeleted`. */
	onlyDeleted?: boolean;
	limit?: number;
	offset?: number;
};

function listConditions(opts: ListOptions) {
	const conditions = [];
	if (opts.onlyDeleted) conditions.push(isNotNull(posts.deletedAt));
	else if (!opts.includeDeleted) conditions.push(isNull(posts.deletedAt));
	if (opts.status) conditions.push(eq(posts.status, opts.status));
	if (opts.authorId) conditions.push(eq(posts.authorId, opts.authorId));
	if (opts.categoryId) conditions.push(eq(posts.categoryId, opts.categoryId));
	if (opts.search) conditions.push(ilike(posts.title, `%${opts.search}%`));
	return conditions;
}

export async function list(opts: ListOptions = {}): Promise<PostListItem[]> {
	const conditions = listConditions(opts);

	let query = db
		.select({
			id: posts.id,
			title: posts.title,
			slug: posts.slug,
			status: posts.status,
			isPinned: posts.isPinned,
			viewCount: posts.viewCount,
			authorId: posts.authorId,
			authorName: users.name,
			categoryId: posts.categoryId,
			categoryName: categories.name,
			publishedAt: posts.publishedAt,
			updatedAt: posts.updatedAt,
			deletedAt: posts.deletedAt
		})
		.from(posts)
		.leftJoin(users, eq(posts.authorId, users.id))
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(desc(posts.isPinned), desc(posts.updatedAt))
		.$dynamic();

	if (opts.limit !== undefined) query = query.limit(opts.limit);
	if (opts.offset !== undefined) query = query.offset(opts.offset);

	return query;
}

/** Count posts matching the given filters (for admin pagination). */
export async function count(opts: ListOptions = {}): Promise<number> {
	const conditions = listConditions(opts);
	const [row] = await db
		.select({ value: sql<number>`count(*)::int` })
		.from(posts)
		.where(conditions.length ? and(...conditions) : undefined);
	return row?.value ?? 0;
}

export async function getById(id: string): Promise<Post | undefined> {
	const [row] = await db
		.select()
		.from(posts)
		.where(and(eq(posts.id, id), isNull(posts.deletedAt)))
		.limit(1);
	return row;
}

/** Get a post regardless of soft-delete state (trash restore / permanent delete). */
export async function getByIdIncludingDeleted(id: string): Promise<Post | undefined> {
	const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	return row;
}

/** Get a post together with the ids of its associated tags. */
export async function getByIdWithTags(
	id: string
): Promise<(Post & { tagIds: string[] }) | undefined> {
	const post = await getById(id);
	if (!post) return undefined;
	const rows = await db
		.select({ tagId: postTags.tagId })
		.from(postTags)
		.where(eq(postTags.postId, id));
	return { ...post, tagIds: rows.map((r) => r.tagId) };
}

/** Whether a slug is already taken by another (non-deleted or deleted) post. */
export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
	const conditions = [eq(posts.slug, slug)];
	if (exceptId) conditions.push(ne(posts.id, exceptId));
	const [row] = await db
		.select({ id: posts.id })
		.from(posts)
		.where(and(...conditions))
		.limit(1);
	return Boolean(row);
}

export async function create(data: NewPost, tagIds: string[] = []): Promise<Post> {
	return db.transaction(async (tx) => {
		const [row] = await tx.insert(posts).values(data).returning();
		if (tagIds.length) {
			await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: row.id, tagId })));
		}
		return row;
	});
}

export async function update(
	id: string,
	data: Partial<Omit<NewPost, 'id'>>,
	tagIds?: string[]
): Promise<Post | undefined> {
	return db.transaction(async (tx) => {
		const [row] = await tx.update(posts).set(data).where(eq(posts.id, id)).returning();
		if (!row) return undefined;
		if (tagIds) {
			await tx.delete(postTags).where(eq(postTags.postId, id));
			if (tagIds.length) {
				await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
			}
		}
		return row;
	});
}

/** Soft-delete a post (set `deletedAt`). */
export async function softDelete(id: string): Promise<Post | undefined> {
	const [row] = await db
		.update(posts)
		.set({ deletedAt: new Date() })
		.where(and(eq(posts.id, id), isNull(posts.deletedAt)))
		.returning();
	return row;
}

/** Restore a soft-deleted post. */
export async function restore(id: string): Promise<Post | undefined> {
	const [row] = await db.update(posts).set({ deletedAt: null }).where(eq(posts.id, id)).returning();
	return row;
}

/** Permanently delete a post — only allowed for rows already in the trash. */
export async function hardDelete(id: string): Promise<boolean> {
	const rows = await db
		.delete(posts)
		.where(and(eq(posts.id, id), isNotNull(posts.deletedAt)))
		.returning({ id: posts.id });
	return rows.length > 0;
}

/** Soft-delete many posts at once (admin bulk action). Returns the count deleted. */
export async function bulkSoftDelete(ids: string[]): Promise<number> {
	if (!ids.length) return 0;
	const rows = await db
		.update(posts)
		.set({ deletedAt: new Date() })
		.where(and(inArray(posts.id, ids), isNull(posts.deletedAt)))
		.returning({ id: posts.id });
	return rows.length;
}

/** Set or clear the pinned (featured on homepage) flag. */
export async function setPinned(id: string, pinned: boolean): Promise<Post | undefined> {
	const [row] = await db
		.update(posts)
		.set({ isPinned: pinned })
		.where(and(eq(posts.id, id), isNull(posts.deletedAt)))
		.returning();
	return row;
}

/** Atomically increment the view counter for a post. */
export async function incrementViewCount(id: string): Promise<void> {
	await db
		.update(posts)
		// Keep updatedAt unchanged: a public view is not a content edit ($onUpdate would bump it).
		.set({ viewCount: sql`${posts.viewCount} + 1`, updatedAt: sql`${posts.updatedAt}` })
		.where(eq(posts.id, id));
}

// ─────────────────────────── Public read queries ────────────────────────────
// Public-facing queries only ever return PUBLISHED, non-deleted posts.

/** Card shape for public listings/search results. */
export type PublicPostCard = {
	id: string;
	title: string;
	slug: string;
	excerpt: string | null;
	categoryName: string | null;
	thumbnailUrl: string | null;
	thumbnailAltText: string | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	publishedAt: Date | null;
};

const PUBLIC_CONDITIONS = () => and(eq(posts.status, 'PUBLISHED'), isNull(posts.deletedAt));

const PUBLIC_CARD_COLUMNS = {
	id: posts.id,
	title: posts.title,
	slug: posts.slug,
	excerpt: posts.excerpt,
	categoryName: categories.name,
	thumbnailUrl: media.url,
	thumbnailAltText: media.altText,
	thumbnailWidth: media.width,
	thumbnailHeight: media.height,
	publishedAt: posts.publishedAt
} as const;

/** Paginated list of published posts (pinned first, then newest). */
export async function listPublished(
	limit: number,
	offset: number,
	categoryId?: string
): Promise<PublicPostCard[]> {
	return db
		.select(PUBLIC_CARD_COLUMNS)
		.from(posts)
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.leftJoin(media, eq(posts.thumbnailMediaId, media.id))
		.where(and(PUBLIC_CONDITIONS(), categoryId ? eq(posts.categoryId, categoryId) : undefined))
		.orderBy(desc(posts.isPinned), desc(posts.publishedAt))
		.limit(limit)
		.offset(offset);
}

export async function listRelated(
	categoryId: string,
	excludeId: string,
	limit = 4
): Promise<PublicPostCard[]> {
	return db
		.select(PUBLIC_CARD_COLUMNS)
		.from(posts)
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.leftJoin(media, eq(posts.thumbnailMediaId, media.id))
		.where(and(PUBLIC_CONDITIONS(), eq(posts.categoryId, categoryId), ne(posts.id, excludeId)))
		.orderBy(desc(posts.publishedAt), desc(posts.id))
		.limit(limit);
}

/** Pinned/featured published posts for the homepage (newest first). */
export async function listPinned(limit: number): Promise<PublicPostCard[]> {
	return db
		.select(PUBLIC_CARD_COLUMNS)
		.from(posts)
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.leftJoin(media, eq(posts.thumbnailMediaId, media.id))
		.where(and(PUBLIC_CONDITIONS(), eq(posts.isPinned, true)))
		.orderBy(desc(posts.publishedAt))
		.limit(limit);
}

/** Total number of published posts (for pagination). */
export async function countPublished(categoryId?: string): Promise<number> {
	const [row] = await db
		.select({ value: sql<number>`count(*)::int` })
		.from(posts)
		.where(and(PUBLIC_CONDITIONS(), categoryId ? eq(posts.categoryId, categoryId) : undefined));
	return row?.value ?? 0;
}

/** Full published post by slug, with resolved author/category names. */
export async function getPublishedBySlug(slug: string): Promise<
	| (Post & {
			authorName: string | null;
			categoryName: string | null;
			thumbnailUrl: string | null;
			thumbnailAltText: string | null;
			thumbnailWidth: number | null;
			thumbnailHeight: number | null;
	  })
	| undefined
> {
	const [row] = await db
		.select({
			post: posts,
			authorName: users.name,
			categoryName: categories.name,
			thumbnailUrl: media.url,
			thumbnailAltText: media.altText,
			thumbnailWidth: media.width,
			thumbnailHeight: media.height
		})
		.from(posts)
		.leftJoin(users, eq(posts.authorId, users.id))
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.leftJoin(media, eq(posts.thumbnailMediaId, media.id))
		.where(and(eq(posts.slug, slug), PUBLIC_CONDITIONS()))
		.limit(1);
	if (!row) return undefined;
	const { post, ...metadata } = row;
	return { ...post, ...metadata };
}

/** Full-text search over published posts using the generated `search_vector` (tsvector). */
export async function search(
	query: string,
	limit: number,
	offset: number
): Promise<PublicPostCard[]> {
	const tsquery = sql`plainto_tsquery('simple', ${query})`;
	return db
		.select(PUBLIC_CARD_COLUMNS)
		.from(posts)
		.leftJoin(categories, eq(posts.categoryId, categories.id))
		.leftJoin(media, eq(posts.thumbnailMediaId, media.id))
		.where(and(PUBLIC_CONDITIONS(), sql`${posts.searchVector} @@ ${tsquery}`))
		.orderBy(sql`ts_rank(${posts.searchVector}, ${tsquery}) desc`, desc(posts.publishedAt))
		.limit(limit)
		.offset(offset);
}

/** Count of published posts matching a search query. */
export async function countSearch(query: string): Promise<number> {
	const tsquery = sql`plainto_tsquery('simple', ${query})`;
	const [row] = await db
		.select({ value: sql<number>`count(*)::int` })
		.from(posts)
		.where(and(PUBLIC_CONDITIONS(), sql`${posts.searchVector} @@ ${tsquery}`));
	return row?.value ?? 0;
}

/** Lightweight list of all published posts for sitemap/RSS (slug + timestamps). */
export async function listPublishedForFeed(): Promise<
	Pick<Post, 'slug' | 'title' | 'content' | 'publishedAt' | 'updatedAt'>[]
> {
	return db
		.select({
			slug: posts.slug,
			title: posts.title,
			content: posts.content,
			publishedAt: posts.publishedAt,
			updatedAt: posts.updatedAt
		})
		.from(posts)
		.where(PUBLIC_CONDITIONS())
		.orderBy(desc(posts.publishedAt));
}
