import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import { slugify } from '$lib/utils/slug';
import * as categoriesRepo from '$lib/server/repositories/categories.repository';
import type { CategoryInput } from '$lib/server/validators/categories';
import type { Category } from '$lib/db/schema';

/**
 * Categories service — Blogger-style label management for posts.
 * Managing categories follows the posts RBAC: ADMIN + EDITOR may write, STAFF read-only.
 */

export type Actor = { id: string; role: Role };

function assertCanManage(actor: Actor): void {
	// Categories belong to the posts domain; creating posts implies managing categories.
	if (!can(actor.role, 'create', 'posts')) throw AppError.forbidden();
}

export async function listCategoriesWithCounts(
	actor: Actor
): Promise<categoriesRepo.CategoryWithCount[]> {
	if (!can(actor.role, 'read', 'posts')) throw AppError.forbidden();
	return categoriesRepo.listWithPostCounts();
}

/** Resolve a unique slug from a preferred value (or the name), avoiding collisions. */
async function resolveSlug(preferred: string | undefined, name: string, exceptId?: string) {
	const base = slugify(preferred || name) || 'kategori';
	let candidate = base;
	let n = 2;
	while (await categoriesRepo.slugExists(candidate, exceptId)) {
		candidate = `${base}-${n}`;
		n += 1;
	}
	return candidate;
}

export async function createCategory(actor: Actor, input: CategoryInput): Promise<Category> {
	assertCanManage(actor);
	const slug = await resolveSlug(input.slug, input.name);
	return categoriesRepo.create({ name: input.name, slug });
}

export async function updateCategory(
	actor: Actor,
	id: string,
	input: CategoryInput
): Promise<Category> {
	assertCanManage(actor);
	const existing = await categoriesRepo.getById(id);
	if (!existing) throw AppError.notFound('Kategori tidak ditemukan');

	const slug = await resolveSlug(input.slug, input.name, id);
	const updated = await categoriesRepo.update(id, { name: input.name, slug });
	if (!updated) throw AppError.notFound('Kategori tidak ditemukan');
	return updated;
}

/** Delete a category. Posts that use it are kept (FK sets their category to null). */
export async function deleteCategory(actor: Actor, id: string): Promise<void> {
	assertCanManage(actor);
	const existing = await categoriesRepo.getById(id);
	if (!existing) throw AppError.notFound('Kategori tidak ditemukan');
	await categoriesRepo.remove(id);
}
