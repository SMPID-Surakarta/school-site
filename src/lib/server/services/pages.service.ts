import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import { slugify } from '$lib/utils/slug';
import * as pagesRepo from '$lib/server/repositories/pages.repository';
import type { CreatePageInput, UpdatePageInput } from '$lib/server/validators/pages';
import type { NewPage, Page } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

async function resolveSlug(preferred: string | undefined, title: string, exceptId?: string) {
	const base = slugify(preferred || title) || 'halaman';
	let candidate = base;
	let n = 2;
	while (await pagesRepo.slugExists(candidate, exceptId)) {
		candidate = `${base}-${n}`;
		n += 1;
	}
	return candidate;
}

export async function listPages(actor: Actor): Promise<Page[]> {
	if (!can(actor.role, 'read', 'pages')) throw AppError.forbidden();
	return pagesRepo.list();
}

export async function getPage(actor: Actor, id: string): Promise<Page> {
	if (!can(actor.role, 'update', 'pages')) throw AppError.forbidden();
	const row = await pagesRepo.getById(id);
	if (!row) throw AppError.notFound('Halaman tidak ditemukan');
	return row;
}

export async function createPage(actor: Actor, input: CreatePageInput): Promise<Page> {
	if (!can(actor.role, 'create', 'pages')) throw AppError.forbidden();

	const slug = await resolveSlug(input.slug, input.title);
	const data: NewPage = {
		title: input.title,
		slug,
		content: input.content,
		published: input.published
	};
	return pagesRepo.create(data);
}

export async function updatePage(actor: Actor, id: string, input: UpdatePageInput): Promise<Page> {
	if (!can(actor.role, 'update', 'pages')) throw AppError.forbidden();

	const existing = await pagesRepo.getById(id);
	if (!existing) throw AppError.notFound('Halaman tidak ditemukan');

	const slug = await resolveSlug(input.slug, input.title, id);
	const data: Partial<Omit<NewPage, 'id'>> = {
		title: input.title,
		slug,
		content: input.content,
		published: input.published
	};
	const updated = await pagesRepo.update(id, data);
	if (!updated) throw AppError.notFound('Halaman tidak ditemukan');
	return updated;
}

export async function deletePage(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'pages')) throw AppError.forbidden();
	const existing = await pagesRepo.getById(id);
	if (!existing) throw AppError.notFound('Halaman tidak ditemukan');
	await pagesRepo.remove(id);
}
