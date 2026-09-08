import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as agendasRepo from '$lib/server/repositories/agendas.repository';
import type { CreateAgendaInput, UpdateAgendaInput } from '$lib/server/validators/agendas';
import type { Agenda, NewAgenda } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function parseDate(value: string, label: string): Date {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) throw AppError.validation(`${label} tidak valid`);
	return date;
}

export async function listAgendas(actor: Actor): Promise<Agenda[]> {
	if (!can(actor.role, 'read', 'agendas')) throw AppError.forbidden();
	return agendasRepo.list();
}

export async function getAgenda(actor: Actor, id: string): Promise<Agenda> {
	if (!can(actor.role, 'update', 'agendas')) throw AppError.forbidden();
	const row = await agendasRepo.getById(id);
	if (!row) throw AppError.notFound('Agenda tidak ditemukan');
	return row;
}

function toData(input: CreateAgendaInput): NewAgenda {
	const startDate = parseDate(input.startDate, 'Tanggal mulai');
	const endDate = input.endDate ? parseDate(input.endDate, 'Tanggal selesai') : null;
	if (endDate && endDate < startDate) {
		throw AppError.validation('Tanggal selesai tidak boleh sebelum tanggal mulai');
	}
	return {
		title: input.title,
		description: emptyToNull(input.description),
		startDate,
		endDate,
		location: emptyToNull(input.location)
	};
}

export async function createAgenda(actor: Actor, input: CreateAgendaInput): Promise<Agenda> {
	if (!can(actor.role, 'create', 'agendas')) throw AppError.forbidden();
	return agendasRepo.create(toData(input));
}

export async function updateAgenda(
	actor: Actor,
	id: string,
	input: UpdateAgendaInput
): Promise<Agenda> {
	if (!can(actor.role, 'update', 'agendas')) throw AppError.forbidden();

	const existing = await agendasRepo.getById(id);
	if (!existing) throw AppError.notFound('Agenda tidak ditemukan');

	const updated = await agendasRepo.update(id, toData(input));
	if (!updated) throw AppError.notFound('Agenda tidak ditemukan');
	return updated;
}

export async function deleteAgenda(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'agendas')) throw AppError.forbidden();
	const existing = await agendasRepo.getById(id);
	if (!existing) throw AppError.notFound('Agenda tidak ditemukan');
	await agendasRepo.remove(id);
}
