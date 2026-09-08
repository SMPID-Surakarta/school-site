import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as downloadsRepo from '$lib/server/repositories/downloads.repository';
import type { CreateDownloadInput, UpdateDownloadInput } from '$lib/server/validators/downloads';
import type { Download, NewDownload } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export async function listDownloads(actor: Actor): Promise<Download[]> {
	if (!can(actor.role, 'read', 'downloads')) throw AppError.forbidden();
	return downloadsRepo.list();
}

export async function getDownload(actor: Actor, id: string): Promise<Download> {
	if (!can(actor.role, 'update', 'downloads')) throw AppError.forbidden();
	const row = await downloadsRepo.getById(id);
	if (!row) throw AppError.notFound('Berkas tidak ditemukan');
	return row;
}

export async function createDownload(actor: Actor, input: CreateDownloadInput): Promise<Download> {
	if (!can(actor.role, 'create', 'downloads')) throw AppError.forbidden();

	const data: NewDownload = {
		title: input.title,
		url: emptyToNull(input.url),
		category: emptyToNull(input.category),
		size: emptyToNull(input.size),
		fileMediaId: input.fileMediaId ?? null
	};
	return downloadsRepo.create(data);
}

export async function updateDownload(
	actor: Actor,
	id: string,
	input: UpdateDownloadInput
): Promise<Download> {
	if (!can(actor.role, 'update', 'downloads')) throw AppError.forbidden();

	const existing = await downloadsRepo.getById(id);
	if (!existing) throw AppError.notFound('Berkas tidak ditemukan');

	const data: Partial<Omit<NewDownload, 'id'>> = {
		title: input.title,
		url: emptyToNull(input.url),
		category: emptyToNull(input.category),
		size: emptyToNull(input.size),
		fileMediaId: input.fileMediaId ?? null
	};
	const updated = await downloadsRepo.update(id, data);
	if (!updated) throw AppError.notFound('Berkas tidak ditemukan');
	return updated;
}

export async function deleteDownload(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'downloads')) throw AppError.forbidden();
	const existing = await downloadsRepo.getById(id);
	if (!existing) throw AppError.notFound('Berkas tidak ditemukan');
	await downloadsRepo.remove(id);
}
