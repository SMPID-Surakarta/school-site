import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { settings, type NewSettings, type Settings } from '$lib/db/schema';

/**
 * Settings repository — single-row table (id = 1). Pure CRUD/query, no business logic.
 */

export async function get(): Promise<Settings | undefined> {
	const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
	return row;
}

/** Insert the single settings row if missing, otherwise update it. */
export async function upsert(data: Omit<NewSettings, 'id'>): Promise<Settings> {
	const [row] = await db
		.insert(settings)
		.values({ ...data, id: 1 })
		.onConflictDoUpdate({ target: settings.id, set: data })
		.returning();
	return row;
}
