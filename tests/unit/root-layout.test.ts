import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '$lib/db/schema';

vi.mock('$lib/server/services/public.service', () => ({ getSiteSettings: vi.fn() }));
vi.mock('$lib/server/services/media.service', () => ({ getMediaUrl: vi.fn() }));

import * as publicService from '$lib/server/services/public.service';
import * as mediaService from '$lib/server/services/media.service';
import { load } from '../../src/routes/+layout.server';

const auth = vi.fn<App.Locals['auth']>();
const event = { locals: { auth } } as unknown as Parameters<typeof load>[0];

beforeEach(() => {
	vi.resetAllMocks();
	auth.mockResolvedValue(null);
});

describe('root layout favicon', () => {
	it('loads the saved favicon for anonymous visitors without admin permissions', async () => {
		const settings = { faviconMediaId: 'favicon-id', logoMediaId: 'logo-id' } as Settings;
		vi.mocked(publicService.getSiteSettings).mockResolvedValue(settings);
		vi.mocked(mediaService.getMediaUrl).mockImplementation(async (id) => `/uploads/${id}.avif`);

		await expect(load(event)).resolves.toMatchObject({
			session: null,
			settings,
			faviconUrl: '/uploads/favicon-id.avif',
			logoUrl: '/uploads/logo-id.avif'
		});
		expect(publicService.getSiteSettings).toHaveBeenCalledWith();
		expect(mediaService.getMediaUrl).toHaveBeenCalledWith('favicon-id');
	});

	it('reads the replacement favicon on the next load', async () => {
		vi.mocked(publicService.getSiteSettings)
			.mockResolvedValueOnce({ faviconMediaId: 'old-id' } as Settings)
			.mockResolvedValueOnce({ faviconMediaId: 'new-id' } as Settings);
		vi.mocked(mediaService.getMediaUrl).mockImplementation(async (id) => `/uploads/${id}.webp`);

		await expect(load(event)).resolves.toMatchObject({ faviconUrl: '/uploads/old-id.webp' });
		await expect(load(event)).resolves.toMatchObject({ faviconUrl: '/uploads/new-id.webp' });
	});

	it('allows the default favicon when settings have not been saved', async () => {
		vi.mocked(publicService.getSiteSettings).mockResolvedValue(undefined);

		await expect(load(event)).resolves.toMatchObject({
			settings: undefined,
			faviconUrl: undefined,
			logoUrl: undefined
		});
		expect(mediaService.getMediaUrl).not.toHaveBeenCalled();
	});

	it('allows the default favicon when the saved media no longer exists', async () => {
		vi.mocked(publicService.getSiteSettings).mockResolvedValue({
			faviconMediaId: 'missing-id'
		} as Settings);
		vi.mocked(mediaService.getMediaUrl).mockResolvedValue(null);

		await expect(load(event)).resolves.toMatchObject({ faviconUrl: null });
	});
});
