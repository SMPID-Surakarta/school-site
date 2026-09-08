import { customType, timestamp } from 'drizzle-orm/pg-core';

/**
 * Reusable audit timestamp columns.
 * `createdAt` / `updatedAt` are present on (almost) every table per PRD §4.
 */
export const timestamps = {
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date())
};

/**
 * Soft-delete marker for content tables (posts, achievements, galleries, banners).
 * NULL = active, non-NULL = deleted. List queries must filter `deletedAt IS NULL`.
 */
export const softDelete = {
	deletedAt: timestamp('deleted_at', { withTimezone: true })
};

/**
 * Postgres `tsvector` column type for full-text search (PRD §4 posts.search_vector).
 * Defined as a custom type so the generated column is emitted as raw SQL in the migration.
 */
export const tsvector = customType<{ data: string; notNull: false; default: false }>({
	dataType() {
		return 'tsvector';
	}
});
