import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as faqsRepo from '$lib/server/repositories/faqs.repository';
import type { CreateFaqInput, UpdateFaqInput } from '$lib/server/validators/faqs';
import type { Faq, NewFaq } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

export async function listFaqs(actor: Actor): Promise<Faq[]> {
	if (!can(actor.role, 'read', 'faqs')) throw AppError.forbidden();
	return faqsRepo.list();
}

export async function getFaq(actor: Actor, id: string): Promise<Faq> {
	if (!can(actor.role, 'update', 'faqs')) throw AppError.forbidden();
	const row = await faqsRepo.getById(id);
	if (!row) throw AppError.notFound('FAQ tidak ditemukan');
	return row;
}

export async function createFaq(actor: Actor, input: CreateFaqInput): Promise<Faq> {
	if (!can(actor.role, 'create', 'faqs')) throw AppError.forbidden();

	const data: NewFaq = {
		question: input.question,
		answer: input.answer,
		order: input.order
	};
	return faqsRepo.create(data);
}

export async function updateFaq(actor: Actor, id: string, input: UpdateFaqInput): Promise<Faq> {
	if (!can(actor.role, 'update', 'faqs')) throw AppError.forbidden();

	const existing = await faqsRepo.getById(id);
	if (!existing) throw AppError.notFound('FAQ tidak ditemukan');

	const data: Partial<Omit<NewFaq, 'id'>> = {
		question: input.question,
		answer: input.answer,
		order: input.order
	};
	const updated = await faqsRepo.update(id, data);
	if (!updated) throw AppError.notFound('FAQ tidak ditemukan');
	return updated;
}

export async function deleteFaq(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'faqs')) throw AppError.forbidden();
	const existing = await faqsRepo.getById(id);
	if (!existing) throw AppError.notFound('FAQ tidak ditemukan');
	await faqsRepo.remove(id);
}
