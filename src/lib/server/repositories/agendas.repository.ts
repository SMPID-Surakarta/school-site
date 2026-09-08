import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { agendas, type Agenda, type NewAgenda } from '$lib/db/schema';

/** Agendas repository — pure CRUD/query for the `agendas` table. */

export async function list(): Promise<Agenda[]> {
	return db.select().from(agendas).orderBy(asc(agendas.startDate));
}

export async function getById(id: string): Promise<Agenda | undefined> {
	const [row] = await db.select().from(agendas).where(eq(agendas.id, id)).limit(1);
	return row;
}

export async function create(data: NewAgenda): Promise<Agenda> {
	const [row] = await db.insert(agendas).values(data).returning();
	return row;
}

export async function update(
	id: string,
	data: Partial<Omit<NewAgenda, 'id'>>
): Promise<Agenda | undefined> {
	const [row] = await db.update(agendas).set(data).where(eq(agendas.id, id)).returning();
	return row;
}

export async function remove(id: string): Promise<Agenda | undefined> {
	const [row] = await db.delete(agendas).where(eq(agendas.id, id)).returning();
	return row;
}
