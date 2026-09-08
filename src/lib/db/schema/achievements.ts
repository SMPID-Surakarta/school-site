import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';
import { softDelete, timestamps } from './_shared';

export const achievements = pgTable('achievements', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	// Nama siswa peraih prestasi.
	studentName: text('student_name'),
	// Foto siswa peraih prestasi.
	imageMediaId: uuid('image_media_id').references(() => media.id, { onDelete: 'set null' }),
	date: date('date'),
	// Jenis prestasi: Akademik / Non Akademik.
	category: text('category'),
	// Tingkat prestasi: Kota / Provinsi / Nasional.
	level: text('level'),
	// Peringkat, mis. "Juara 1" / "Medali Emas".
	rank: text('rank'),
	...timestamps,
	...softDelete
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
