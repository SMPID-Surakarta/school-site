import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import * as usersRepo from '$lib/server/repositories/users.repository';
import type { CreateUserInput, UpdateUserInput } from '$lib/server/validators/users';
import type { User } from '$lib/db/schema';

/** Public-safe user shape (never leak the password hash). */
export type SafeUser = Omit<User, 'passwordHash'>;

function toSafe(user: User): SafeUser {
	const { passwordHash, ...safe } = user;
	return safe;
}

/** Verify credentials for the Auth.js Credentials provider. Returns null on any failure. */
export async function authenticate(email: string, password: string): Promise<SafeUser | null> {
	const user = await usersRepo.getByEmail(email.toLowerCase().trim());
	if (!user || !user.isActive || !user.passwordHash) return null;

	const valid = await verifyPassword(user.passwordHash, password);
	if (!valid) return null;

	return toSafe(user);
}

export async function listUsers(actorRole: Role): Promise<SafeUser[]> {
	if (!can(actorRole, 'read', 'users')) throw AppError.forbidden();
	const users = await usersRepo.listAll();
	return users.map(toSafe);
}

export async function getUser(actorRole: Role, id: string): Promise<SafeUser> {
	if (!can(actorRole, 'read', 'users')) throw AppError.forbidden();
	const user = await usersRepo.getById(id);
	if (!user) throw AppError.notFound('User tidak ditemukan');
	return toSafe(user);
}

export async function createUser(actorRole: Role, input: CreateUserInput): Promise<SafeUser> {
	if (!can(actorRole, 'create', 'users')) throw AppError.forbidden();

	const existing = await usersRepo.getByEmail(input.email);
	if (existing) throw AppError.conflict('Email sudah terdaftar');

	const passwordHash = await hashPassword(input.password);
	const created = await usersRepo.create({
		name: input.name,
		email: input.email,
		role: input.role,
		isActive: input.isActive,
		passwordHash
	});
	return toSafe(created);
}

export async function updateUser(
	actorRole: Role,
	id: string,
	input: UpdateUserInput
): Promise<SafeUser> {
	if (!can(actorRole, 'update', 'users')) throw AppError.forbidden();

	const target = await usersRepo.getById(id);
	if (!target) throw AppError.notFound('User tidak ditemukan');

	// Guard against demoting/deactivating the last active ADMIN.
	const losingAdmin =
		target.role === 'ADMIN' && (input.role !== 'ADMIN' || input.isActive === false);
	if (losingAdmin) {
		const activeAdmins = await usersRepo.countActiveByRole('ADMIN');
		if (activeAdmins <= 1) {
			throw AppError.conflict('Tidak dapat menonaktifkan/menurunkan ADMIN aktif terakhir');
		}
	}

	const patch: Partial<User> = {
		name: input.name,
		role: input.role,
		isActive: input.isActive
	};
	if (input.password) {
		patch.passwordHash = await hashPassword(input.password);
	}

	const updated = await usersRepo.update(id, patch);
	if (!updated) throw AppError.notFound('User tidak ditemukan');
	return toSafe(updated);
}
