import { type SQL, sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { softDelete, timestamps, tsvector } from './_shared';
import { users } from './users';
import { categories } from './categories';
import { tags } from './tags';
import { media } from './media';

export const postStatusEnum = pgEnum('post_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const posts = pgTable(
	'posts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		title: text('title').notNull(),
		slug: text('slug').notNull().unique(),
		// Rich-text HTML (sanitized server-side before persistence).
		content: text('content').notNull(),
		// Ringkasan singkat; jika kosong, di-generate otomatis dari konten saat ditampilkan.
		excerpt: text('excerpt'),
		thumbnailMediaId: uuid('thumbnail_media_id').references(() => media.id, {
			onDelete: 'set null'
		}),
		authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
		categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
		seoTitle: text('seo_title'),
		seoDescription: text('seo_description'),
		seoKeywords: text('seo_keywords'),
		ogImage: text('og_image'),
		status: postStatusEnum('status').notNull().default('DRAFT'),
		// Disematkan/diunggulkan di homepage untuk pengumuman penting.
		isPinned: boolean('is_pinned').notNull().default(false),
		// Jumlah dilihat (statistik sederhana), di-increment saat artikel dibuka publik.
		viewCount: integer('view_count').notNull().default(0),
		// Tanggal tayang; berbeda dari createdAt, dipakai untuk urutan sitemap/RSS.
		publishedAt: timestamp('published_at', { withTimezone: true }),
		// Full-text search vector, generated dari title (bobot A) + content (bobot B).
		// Config 'simple' dipilih agar aman untuk bahasa Indonesia (tanpa stemming Inggris).
		searchVector: tsvector('search_vector').generatedAlwaysAs(
			(): SQL =>
				sql`setweight(to_tsvector('simple', coalesce(${posts.title}, '')), 'A') || setweight(to_tsvector('simple', coalesce(${posts.content}, '')), 'B')`
		),
		...timestamps,
		...softDelete
	},
	(table) => [index('posts_search_vector_idx').using('gin', table.searchVector)]
);

/** Junction table for the many-to-many posts <-> tags relationship (PRD §4). */
export const postTags = pgTable(
	'post_tags',
	{
		postId: uuid('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		tagId: uuid('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.postId, table.tagId] })]
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostStatus = (typeof postStatusEnum.enumValues)[number];
