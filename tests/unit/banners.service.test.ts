import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/repositories/banners.repository');

import * as bannersRepo from '$lib/server/repositories/banners.repository';
import * as bannersService from '$lib/server/services/banners.service';
import type { CreateBannerInput } from '$lib/server/validators/banners';

const ADMIN = { id: 'admin', role: 'ADMIN' as const };
const EDITOR = { id: 'editor', role: 'EDITOR' as const };

function input(overrides: Partial<CreateBannerInput> = {}): CreateBannerInput {
	return {
		title: 'Penerimaan Siswa Baru',
		titleFontSize: 60,
		subtitle: '',
		buttonText: '',
		buttonUrl: '',
		order: 0,
		published: true,
		startAt: undefined,
		endAt: undefined,
		imageMediaId: undefined,
		...overrides
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(bannersRepo.create).mockResolvedValue({} as never);
});

describe('banners.service', () => {
	it('stores the selected background media id', async () => {
		const imageMediaId = '11111111-1111-4111-8111-111111111111';

		await bannersService.createBanner(ADMIN, input({ imageMediaId }));

		expect(bannersRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ imageMediaId, published: true })
		);
	});

	it('rejects banner creation by non-admin roles', async () => {
		await expect(bannersService.createBanner(EDITOR, input())).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(bannersRepo.create).not.toHaveBeenCalled();
	});
});
