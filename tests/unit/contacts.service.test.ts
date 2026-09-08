import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/repositories/contacts.repository');

import * as contactsRepo from '$lib/server/repositories/contacts.repository';
import * as contactsService from '$lib/server/services/contacts.service';
import type { Contact } from '$lib/db/schema';

const ADMIN = { id: 'a', role: 'ADMIN' as const };
const EDITOR = { id: 'e', role: 'EDITOR' as const };
const STAFF = { id: 's', role: 'STAFF' as const };

function contact(overrides: Partial<Contact> = {}): Contact {
	return {
		id: 'c1',
		name: 'Wali Murid',
		email: 'wali@example.com',
		phone: null,
		message: 'Halo',
		read: false,
		repliedAt: null,
		createdAt: new Date(),
		...overrides
	} as Contact;
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe('contacts.service RBAC', () => {
	it('STAFF may not list contacts', async () => {
		await expect(contactsService.listContacts(STAFF)).rejects.toMatchObject({ code: 'FORBIDDEN' });
	});

	it('ADMIN and EDITOR may list contacts', async () => {
		vi.mocked(contactsRepo.list).mockResolvedValue([contact()]);
		await expect(contactsService.listContacts(ADMIN)).resolves.toHaveLength(1);
		await expect(contactsService.listContacts(EDITOR)).resolves.toHaveLength(1);
	});
});

describe('contacts.service.getContact', () => {
	it('marks an unread contact as read on open', async () => {
		vi.mocked(contactsRepo.getById).mockResolvedValue(contact({ read: false }));
		vi.mocked(contactsRepo.update).mockResolvedValue(contact({ read: true }));
		const result = await contactsService.getContact(ADMIN, 'c1');
		expect(contactsRepo.update).toHaveBeenCalledWith('c1', { read: true });
		expect(result.read).toBe(true);
	});

	it('does not re-update an already-read contact', async () => {
		vi.mocked(contactsRepo.getById).mockResolvedValue(contact({ read: true }));
		await contactsService.getContact(ADMIN, 'c1');
		expect(contactsRepo.update).not.toHaveBeenCalled();
	});

	it('throws NOT_FOUND for a missing contact', async () => {
		vi.mocked(contactsRepo.getById).mockResolvedValue(undefined);
		await expect(contactsService.getContact(ADMIN, 'missing')).rejects.toMatchObject({
			code: 'NOT_FOUND'
		});
	});
});

describe('contacts.service.markReplied', () => {
	it('STAFF may not reply', async () => {
		await expect(contactsService.markReplied(STAFF, 'c1')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
	});

	it('sets repliedAt and read when EDITOR replies', async () => {
		vi.mocked(contactsRepo.getById).mockResolvedValue(contact());
		vi.mocked(contactsRepo.update).mockResolvedValue(
			contact({ read: true, repliedAt: new Date() })
		);
		await contactsService.markReplied(EDITOR, 'c1');
		const [id, patch] = vi.mocked(contactsRepo.update).mock.calls[0];
		expect(id).toBe('c1');
		expect(patch.read).toBe(true);
		expect(patch.repliedAt).toBeInstanceOf(Date);
	});
});
