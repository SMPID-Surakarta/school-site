import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/repositories/teachers.repository');

import * as teachersRepo from '$lib/server/repositories/teachers.repository';
import * as teachersService from '$lib/server/services/teachers.service';
import type { CreateTeacherInput } from '$lib/server/validators/teachers';

const ADMIN = { id: 'a', role: 'ADMIN' as const };
const EDITOR = { id: 'e', role: 'EDITOR' as const };
const STAFF = { id: 's', role: 'STAFF' as const };

function input(overrides: Partial<CreateTeacherInput> = {}): CreateTeacherInput {
	return {
		name: 'Budi Guru',
		slug: undefined,
		position: '',
		subject: '',
		nipNuptk: '',
		bio: '',
		photoMediaId: undefined,
		isActive: true,
		...overrides
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(teachersRepo.slugExists).mockResolvedValue(false);
	vi.mocked(teachersRepo.create).mockImplementation(
		async (data) => ({ id: 't1', ...data }) as never
	);
});

describe('teachers.service (content resource RBAC)', () => {
	it('STAFF may read but not create', async () => {
		vi.mocked(teachersRepo.list).mockResolvedValue([]);
		await expect(teachersService.listTeachers(STAFF)).resolves.toEqual([]);
		await expect(teachersService.createTeacher(STAFF, input())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('EDITOR may create with a generated slug', async () => {
		await teachersService.createTeacher(EDITOR, input({ name: 'Budi Guru' }));
		const [data] = vi.mocked(teachersRepo.create).mock.calls[0];
		expect(data.slug).toBe('budi-guru');
		expect(data.isActive).toBe(true);
	});

	it('empty optional fields are stored as null', async () => {
		await teachersService.createTeacher(ADMIN, input({ position: '', subject: '' }));
		const [data] = vi.mocked(teachersRepo.create).mock.calls[0];
		expect(data.position).toBeNull();
		expect(data.subject).toBeNull();
	});
});
