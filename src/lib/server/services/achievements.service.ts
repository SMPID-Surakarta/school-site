import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as achievementsRepo from '$lib/server/repositories/achievements.repository';
import type {
	CreateAchievementInput,
	UpdateAchievementInput
} from '$lib/server/validators/achievements';
import type { Achievement, NewAchievement } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export async function listAchievements(actor: Actor): Promise<Achievement[]> {
	if (!can(actor.role, 'read', 'achievements')) throw AppError.forbidden();
	return achievementsRepo.list();
}

export async function getAchievement(actor: Actor, id: string): Promise<Achievement> {
	if (!can(actor.role, 'update', 'achievements')) throw AppError.forbidden();
	const row = await achievementsRepo.getById(id);
	if (!row) throw AppError.notFound('Prestasi tidak ditemukan');
	return row;
}

export async function createAchievement(
	actor: Actor,
	input: CreateAchievementInput
): Promise<Achievement> {
	if (!can(actor.role, 'create', 'achievements')) throw AppError.forbidden();

	const data: NewAchievement = {
		title: input.title,
		description: emptyToNull(input.description),
		studentName: emptyToNull(input.studentName),
		date: input.date ?? null,
		category: input.category ?? null,
		level: input.level ?? null,
		rank: emptyToNull(input.rank),
		imageMediaId: input.imageMediaId ?? null
	};
	return achievementsRepo.create(data);
}

export async function updateAchievement(
	actor: Actor,
	id: string,
	input: UpdateAchievementInput
): Promise<Achievement> {
	if (!can(actor.role, 'update', 'achievements')) throw AppError.forbidden();

	const existing = await achievementsRepo.getById(id);
	if (!existing) throw AppError.notFound('Prestasi tidak ditemukan');

	const data: Partial<Omit<NewAchievement, 'id'>> = {
		title: input.title,
		description: emptyToNull(input.description),
		studentName: emptyToNull(input.studentName),
		date: input.date ?? null,
		category: input.category ?? null,
		level: input.level ?? null,
		rank: emptyToNull(input.rank),
		imageMediaId: input.imageMediaId ?? null
	};
	const updated = await achievementsRepo.update(id, data);
	if (!updated) throw AppError.notFound('Prestasi tidak ditemukan');
	return updated;
}

export async function deleteAchievement(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'achievements')) throw AppError.forbidden();
	const existing = await achievementsRepo.getById(id);
	if (!existing) throw AppError.notFound('Prestasi tidak ditemukan');
	await achievementsRepo.softDelete(id);
}
