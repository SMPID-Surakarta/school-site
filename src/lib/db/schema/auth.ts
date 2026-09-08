import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Auth.js (`@auth/drizzle-adapter`) contract tables. Column shapes follow the official
 * Drizzle adapter schema for PostgreSQL — do not rename columns (PRD §4.1, db-schema rules).
 */

export const accounts = pgTable(
	'accounts',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

export const sessions = pgTable('sessions', {
	sessionToken: text('session_token').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { withTimezone: true }).notNull()
});

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { withTimezone: true }).notNull()
	},
	(vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);
