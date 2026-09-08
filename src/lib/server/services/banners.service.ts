import type { Role } from '$lib/rbac';
import { can } from '$lib/rbac';
import { AppError } from '$lib/server/errors';
import * as bannersRepo from '$lib/server/repositories/banners.repository';
import type { CreateBannerInput, UpdateBannerInput } from '$lib/server/validators/banners';
import type { Banner, NewBanner } from '$lib/db/schema';

/** Acting user for permission checks. */
export type Actor = { id: string; role: Role };

function emptyToNull(value?: string): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function parseDate(value: string | undefined, label: string): Date | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) throw AppError.validation(`${label} tidak valid`);
	return date;
}

function toData(input: CreateBannerInput): NewBanner {
	const startAt = parseDate(input.startAt, 'Tanggal mulai');
	const endAt = parseDate(input.endAt, 'Tanggal selesai');
	if (startAt && endAt && endAt < startAt) {
		throw AppError.validation('Tanggal selesai tidak boleh sebelum tanggal mulai');
	}
	return {
		title: input.title,
		titleFontSize: input.titleFontSize,
		subtitle: emptyToNull(input.subtitle),
		buttonText: emptyToNull(input.buttonText),
		buttonUrl: emptyToNull(input.buttonUrl),
		order: input.order,
		published: input.published,
		startAt,
		endAt,
		imageMediaId: input.imageMediaId ?? null
	};
}

export async function listBanners(actor: Actor): Promise<Banner[]> {
	if (!can(actor.role, 'read', 'banners')) throw AppError.forbidden();
	return bannersRepo.list();
}

export async function getBanner(actor: Actor, id: string): Promise<Banner> {
	if (!can(actor.role, 'update', 'banners')) throw AppError.forbidden();
	const row = await bannersRepo.getById(id);
	if (!row) throw AppError.notFound('Banner tidak ditemukan');
	return row;
}

export async function createBanner(actor: Actor, input: CreateBannerInput): Promise<Banner> {
	if (!can(actor.role, 'create', 'banners')) throw AppError.forbidden();
	return bannersRepo.create(toData(input));
}

export async function updateBanner(
	actor: Actor,
	id: string,
	input: UpdateBannerInput
): Promise<Banner> {
	if (!can(actor.role, 'update', 'banners')) throw AppError.forbidden();

	const existing = await bannersRepo.getById(id);
	if (!existing) throw AppError.notFound('Banner tidak ditemukan');

	const updated = await bannersRepo.update(id, toData(input));
	if (!updated) throw AppError.notFound('Banner tidak ditemukan');
	return updated;
}

export async function deleteBanner(actor: Actor, id: string): Promise<void> {
	if (!can(actor.role, 'delete', 'banners')) throw AppError.forbidden();
	const existing = await bannersRepo.getById(id);
	if (!existing) throw AppError.notFound('Banner tidak ditemukan');
	await bannersRepo.softDelete(id);
}
