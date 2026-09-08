import { and, count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, type NewUser, type User } from '$lib/db/schema';

/**
 * Users repository — the only place allowed to run Drizzle queries for the `users` table.
 * No business logic / permission checks here (see services layer).
 */

export async function getById(id: string): Promise<User | undefined> {
	const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return row;
}

export async function getByEmail(email: string): Promise<User | undefined> {
	const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return row;
}

export async function listAll(): Promise<User[]> {
	return db.select().from(users).orderBy(users.createdAt);
}

export async function create(data: NewUser): Promise<User> {
	const [row] = await db.insert(users).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewUser, 'id'>>
): Promise<User | undefined> {
	const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning();
	return row;
}

/** Number of active accounts with the given role (used to guard "last ADMIN" checks). */
export async function countActiveByRole(role: User['role']): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(users)
		.where(and(eq(users.isActive, true), eq(users.role, role)));
	return row?.value ?? 0;
}
