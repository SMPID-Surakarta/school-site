import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '$lib/db/schema';
import { env } from './env';

/**
 * Server-only Drizzle client. This is the single connection instance for the app.
 * Only repositories (`src/lib/server/repositories/`) should import and use `db`.
 */
const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });

export type Database = typeof db;
