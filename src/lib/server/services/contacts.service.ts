import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as contactsRepo from '$lib/server/repositories/contacts.repository';
import type { Contact } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

export async function listContacts(actor: Actor): Promise<Contact[]> {
	if (!can(actor.role, 'read', 'contacts')) throw AppError.forbidden();
	return contactsRepo.list();
}

/** Fetch a contact and mark it as read on first open. */
export async function getContact(actor: Actor, id: string): Promise<Contact> {
	if (!can(actor.role, 'read', 'contacts')) throw AppError.forbidden();
	const row = await contactsRepo.getById(id);
	if (!row) throw AppError.notFound('Pesan tidak ditemukan');

	if (!row.read) {
		const updated = await contactsRepo.update(id, { read: true });
		return updated ?? row;
	}
	return row;
}

/** Mark a contact as replied (records the follow-up timestamp). */
export async function markReplied(actor: Actor, id: string): Promise<Contact> {
	if (!can(actor.role, 'reply', 'contacts')) throw AppError.forbidden();
	const row = await contactsRepo.getById(id);
	if (!row) throw AppError.notFound('Pesan tidak ditemukan');

	const updated = await contactsRepo.update(id, { read: true, repliedAt: new Date() });
	if (!updated) throw AppError.notFound('Pesan tidak ditemukan');
	return updated;
}
