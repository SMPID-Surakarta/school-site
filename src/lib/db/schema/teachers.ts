import { boolean, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';
import { timestamps } from './_shared';

export const teachers = pgTable('teachers', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	position: text('position'),
	// Mapel yang diampu (PRD §4 teachers.subject).
	subject: text('subject'),
	// Nomor identitas guru (NIP/NUPTK), umum di sekolah Indonesia.
	nipNuptk: text('nip_nuptk'),
	bio: text('bio'),
	photoMediaId: uuid('photo_media_id').references(() => media.id, { onDelete: 'set null' }),
	// Guru pindah/pensiun tanpa menghapus data historis.
	isActive: boolean('is_active').notNull().default(true),
	...timestamps
});

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
