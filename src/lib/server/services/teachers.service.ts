import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import { slugify } from '$lib/utils/slug';
import * as teachersRepo from '$lib/server/repositories/teachers.repository';
import type { CreateTeacherInput, UpdateTeacherInput } from '$lib/server/validators/teachers';
import type { NewTeacher, Teacher } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

async function resolveSlug(preferred: string | undefined, name: string, exceptId?: string) {
	const base = slugify(preferred || name) || 'guru';
	let candidate = base;
	let n = 2;
	while (await teachersRepo.slugExists(candidate, exceptId)) {
		candidate = `${base}-${n}`;
		n += 1;
	}
	return candidate;
}

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export async function listTeachers(actor: Actor): Promise<Teacher[]> {
	if (!can(actor.role, 'read', 'teachers')) throw AppError.forbidden();
	return teachersRepo.list();
}

export async function getTeacher(actor: Actor, id: string): Promise<Teacher> {
	if (!can(actor.role, 'update', 'teachers')) throw AppError.forbidden();
	const teacher = await teachersRepo.getById(id);
	if (!teacher) throw AppError.notFound('Guru tidak ditemukan');
	return teacher;
}

export async function createTeacher(actor: Actor, input: CreateTeacherInput): Promise<Teacher> {
	if (!can(actor.role, 'create', 'teachers')) throw AppError.forbidden();

	const slug = await resolveSlug(input.slug, input.name);
	const data: NewTeacher = {
		name: input.name,
		slug,
		position: emptyToNull(input.position),
		subject: emptyToNull(input.subject),
		nipNuptk: emptyToNull(input.nipNuptk),
		bio: emptyToNull(input.bio),
		photoMediaId: input.photoMediaId ?? null,
		isActive: input.isActive
	};
	return teachersRepo.create(data);
}

export async function updateTeacher(
	actor: Actor,
	id: string,
	input: UpdateTeacherInput
): Promise<Teacher> {
	if (!can(actor.role, 'update', 'teachers')) throw AppError.forbidden();

	const existing = await teachersRepo.getById(id);
	if (!existing) throw AppError.notFound('Guru tidak ditemukan');

	const slug = await resolveSlug(input.slug, input.name, id);
	const data: Partial<Omit<NewTeacher, 'id'>> = {
		name: input.name,
		slug,
		position: emptyToNull(input.position),
		subject: emptyToNull(input.subject),
		nipNuptk: emptyToNull(input.nipNuptk),
		bio: emptyToNull(input.bio),
		photoMediaId: input.photoMediaId ?? null,
		isActive: input.isActive
	};
	const updated = await teachersRepo.update(id, data);
	if (!updated) throw AppError.notFound('Guru tidak ditemukan');
	return updated;
}

export async function deleteTeacher(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'teachers')) throw AppError.forbidden();
	const existing = await teachersRepo.getById(id);
	if (!existing) throw AppError.notFound('Guru tidak ditemukan');
	await teachersRepo.remove(id);
}
