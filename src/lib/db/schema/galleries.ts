import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';
import { softDelete, timestamps } from './_shared';

/** Albums for school activity galleries. */
export const galleries = pgTable('galleries', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	eventDate: timestamp('event_date', { withTimezone: true }).notNull().defaultNow(),
	description: text('description'),
	coverMediaId: uuid('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
	/** Legacy flat-gallery fields kept nullable for existing data/migrations. */
	imageMediaId: uuid('image_media_id').references(() => media.id, { onDelete: 'set null' }),
	category: text('category'),
	...timestamps,
	...softDelete
});

export const galleryPhotos = pgTable('gallery_photos', {
	id: uuid('id').defaultRandom().primaryKey(),
	galleryId: uuid('gallery_id')
		.notNull()
		.references(() => galleries.id, { onDelete: 'cascade' }),
	mediaId: uuid('media_id')
		.notNull()
		.references(() => media.id, { onDelete: 'cascade' }),
	orderIndex: integer('order_index').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Gallery = typeof galleries.$inferSelect;
export type NewGallery = typeof galleries.$inferInsert;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;
