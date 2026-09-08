import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

/** Application roles (PRD §6 RBAC matrix). */
export const roleEnum = pgEnum('role', ['ADMIN', 'EDITOR', 'STAFF']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	// Argon2id hash (PRD §9). Nullable to support Auth.js OAuth accounts without a password.
	passwordHash: text('password_hash'),
	role: roleEnum('role').notNull().default('STAFF'),
	// Auth.js adapter field (email verification flow). PRD calls this email_verified_at.
	emailVerified: timestamp('email_verified', { withTimezone: true }),
	// Auth.js adapter field (avatar URL).
	image: text('image'),
	// Disable an account without deleting it (PRD §4 users.is_active).
	isActive: boolean('is_active').notNull().default(true),
	...timestamps
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
