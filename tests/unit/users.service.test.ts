import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/repositories/users.repository');
vi.mock('$lib/server/auth/password');

import * as usersRepo from '$lib/server/repositories/users.repository';
import * as password from '$lib/server/auth/password';
import * as usersService from '$lib/server/services/users.service';
import type { User } from '$lib/db/schema';

function fakeUser(overrides: Partial<User> = {}): User {
	return {
		id: 'u1',
		name: 'Admin',
		email: 'admin@sekolah.test',
		passwordHash: 'hashed',
		role: 'ADMIN',
		emailVerified: null,
		image: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	} as User;
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(password.hashPassword).mockResolvedValue('hashed');
});

describe('users.service.authenticate', () => {
	it('returns a safe user (no passwordHash) on valid credentials', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(fakeUser());
		vi.mocked(password.verifyPassword).mockResolvedValue(true);

		const result = await usersService.authenticate('admin@sekolah.test', 'secret');
		expect(result).not.toBeNull();
		expect(result).not.toHaveProperty('passwordHash');
		expect(result?.email).toBe('admin@sekolah.test');
	});

	it('returns null on wrong password', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(fakeUser());
		vi.mocked(password.verifyPassword).mockResolvedValue(false);
		expect(await usersService.authenticate('admin@sekolah.test', 'nope')).toBeNull();
	});

	it('returns null for an inactive account', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(fakeUser({ isActive: false }));
		expect(await usersService.authenticate('admin@sekolah.test', 'secret')).toBeNull();
		expect(password.verifyPassword).not.toHaveBeenCalled();
	});

	it('returns null when the user does not exist', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(undefined);
		expect(await usersService.authenticate('ghost@sekolah.test', 'secret')).toBeNull();
	});
});

describe('users.service.listUsers', () => {
	it('rejects non-admins', async () => {
		await expect(usersService.listUsers('EDITOR')).rejects.toMatchObject({ code: 'FORBIDDEN' });
		await expect(usersService.listUsers('STAFF')).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('returns safe users for ADMIN', async () => {
		vi.mocked(usersRepo.listAll).mockResolvedValue([fakeUser(), fakeUser({ id: 'u2' })]);
		const users = await usersService.listUsers('ADMIN');
		expect(users).toHaveLength(2);
		expect(users[0]).not.toHaveProperty('passwordHash');
	});
});

describe('users.service.createUser', () => {
	it('rejects non-admins', async () => {
		await expect(
			usersService.createUser('EDITOR', {
				name: 'X',
				email: 'x@y.z',
				password: 'password123',
				role: 'STAFF',
				isActive: true
			})
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('rejects a duplicate email', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(fakeUser());
		await expect(
			usersService.createUser('ADMIN', {
				name: 'X',
				email: 'admin@sekolah.test',
				password: 'password123',
				role: 'STAFF',
				isActive: true
			})
		).rejects.toMatchObject({ code: 'CONFLICT' });
	});

	it('hashes the password and creates the user', async () => {
		vi.mocked(usersRepo.getByEmail).mockResolvedValue(undefined);
		vi.mocked(usersRepo.create).mockResolvedValue(fakeUser({ id: 'new' }));
		await usersService.createUser('ADMIN', {
			name: 'Baru',
			email: 'baru@sekolah.test',
			password: 'password123',
			role: 'EDITOR',
			isActive: true
		});
		expect(password.hashPassword).toHaveBeenCalledWith('password123');
		const [data] = vi.mocked(usersRepo.create).mock.calls[0];
		expect(data.passwordHash).toBe('hashed');
	});
});

describe('users.service.updateUser (last-admin guard)', () => {
	it('prevents demoting the last active ADMIN', async () => {
		vi.mocked(usersRepo.getById).mockResolvedValue(fakeUser({ role: 'ADMIN' }));
		vi.mocked(usersRepo.countActiveByRole).mockResolvedValue(1);
		await expect(
			usersService.updateUser('ADMIN', 'u1', { name: 'Admin', role: 'EDITOR', isActive: true })
		).rejects.toMatchObject({ code: 'CONFLICT' });
		expect(usersRepo.update).not.toHaveBeenCalled();
	});

	it('prevents deactivating the last active ADMIN', async () => {
		vi.mocked(usersRepo.getById).mockResolvedValue(fakeUser({ role: 'ADMIN' }));
		vi.mocked(usersRepo.countActiveByRole).mockResolvedValue(1);
		await expect(
			usersService.updateUser('ADMIN', 'u1', { name: 'Admin', role: 'ADMIN', isActive: false })
		).rejects.toMatchObject({ code: 'CONFLICT' });
	});

	it('allows demoting an ADMIN when another active ADMIN remains', async () => {
		vi.mocked(usersRepo.getById).mockResolvedValue(fakeUser({ role: 'ADMIN' }));
		vi.mocked(usersRepo.countActiveByRole).mockResolvedValue(2);
		vi.mocked(usersRepo.update).mockResolvedValue(fakeUser({ role: 'EDITOR' }));
		const result = await usersService.updateUser('ADMIN', 'u1', {
			name: 'Admin',
			role: 'EDITOR',
			isActive: true
		});
		expect(result.role).toBe('EDITOR');
		expect(usersRepo.update).toHaveBeenCalled();
	});
});
