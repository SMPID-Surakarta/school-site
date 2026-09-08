import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/repositories/settings.repository');

import * as settingsRepo from '$lib/server/repositories/settings.repository';
import * as settingsService from '$lib/server/services/settings.service';
import { defaultLandingPage, landingPageSchema } from '$lib/server/validators/landing-page';
import { defaultTheme } from '$lib/utils/theme';

beforeEach(() => {
	vi.resetAllMocks();
});

describe('settings.service theme', () => {
	it('returns defaults for an unconfigured site', async () => {
		vi.mocked(settingsRepo.get).mockResolvedValue(undefined);
		await expect(settingsService.getTheme('ADMIN')).resolves.toEqual(defaultTheme);
	});

	it('returns the saved theme', async () => {
		const themeConfig = { ...defaultTheme, primaryColor: '#16634a' };
		vi.mocked(settingsRepo.get).mockResolvedValue({ themeConfig } as never);
		await expect(settingsService.getTheme('ADMIN')).resolves.toEqual(themeConfig);
	});

	it('falls back to defaults for malformed stored settings', async () => {
		vi.mocked(settingsRepo.get).mockResolvedValue({
			themeConfig: { primaryColor: 'invalid' }
		} as never);
		await expect(settingsService.getTheme('ADMIN')).resolves.toEqual(defaultTheme);
	});

	it('updates only the theme configuration', async () => {
		vi.mocked(settingsRepo.upsert).mockResolvedValue({} as never);
		await settingsService.saveTheme('ADMIN', defaultTheme);
		expect(settingsRepo.upsert).toHaveBeenCalledWith({ themeConfig: defaultTheme });
	});

	it.each(['EDITOR', 'STAFF'] as const)('rejects %s reads and writes', async (role) => {
		await expect(settingsService.getTheme(role)).rejects.toMatchObject({ code: 'FORBIDDEN' });
		await expect(settingsService.saveTheme(role, defaultTheme)).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		expect(settingsRepo.get).not.toHaveBeenCalled();
		expect(settingsRepo.upsert).not.toHaveBeenCalled();
	});

	it('does not persist invalid colors', async () => {
		await expect(
			settingsService.saveTheme('ADMIN', { ...defaultTheme, primaryColor: '#ffffff' })
		).rejects.toThrow();
		expect(settingsRepo.upsert).not.toHaveBeenCalled();
	});
});

describe('settings.service landing page', () => {
	it('returns defaults when settings have not been configured', async () => {
		vi.mocked(settingsRepo.get).mockResolvedValue(undefined);

		await expect(settingsService.getLandingPage('ADMIN')).resolves.toEqual(defaultLandingPage);
	});

	it('provides a configurable facilities grid with a six-item limit', () => {
		expect(defaultLandingPage).toMatchObject({
			showFacilities: true,
			facilities: expect.arrayContaining([
				expect.objectContaining({ title: 'Laboratorium Praktik' })
			])
		});

		expect(() =>
			landingPageSchema.parse({
				facilities: Array.from({ length: 7 }, (_, index) => ({
					title: `Fasilitas ${index + 1}`,
					description: ''
				}))
			})
		).toThrow();
		expect(() =>
			landingPageSchema.parse({
				facilities: [{ title: 'Laboratorium', description: '', imageMediaId: 'not-a-uuid' }]
			})
		).toThrow();
	});

	it('maps legacy SPMB configuration to the announcement panel', async () => {
		vi.mocked(settingsRepo.get).mockResolvedValue({
			landingPage: {
				showPpdb: true,
				ppdbLabel: 'SPMB',
				ppdbTitle: 'Pendaftaran dibuka',
				ppdbDescription: 'Lihat jadwal pendaftaran.',
				ppdbCtaText: 'Daftar sekarang',
				ppdbCtaUrl: '/ppdb'
			}
		} as never);

		await expect(settingsService.getLandingPage('ADMIN')).resolves.toMatchObject({
			showAnnouncement: true,
			announcementLabel: 'SPMB',
			announcementTitle: 'Pendaftaran dibuka',
			announcementDescription: 'Lihat jadwal pendaftaran.',
			announcementCtaText: 'Daftar sekarang',
			announcementCtaUrl: '/ppdb'
		});
	});

	it('allows ADMIN to save landing-page configuration', async () => {
		vi.mocked(settingsRepo.upsert).mockResolvedValue({} as never);
		const input = { ...defaultLandingPage, heroTitle: 'SMK Siap Berkarya' };

		await settingsService.saveLandingPage('ADMIN', input);

		expect(settingsRepo.upsert).toHaveBeenCalledWith({ landingPage: input });
	});

	it('rejects non-admin reads and updates', async () => {
		await expect(settingsService.getLandingPage('EDITOR')).rejects.toMatchObject({
			code: 'FORBIDDEN'
		});
		await expect(
			settingsService.saveLandingPage('STAFF', defaultLandingPage)
		).rejects.toMatchObject({ code: 'FORBIDDEN' });
		expect(settingsRepo.get).not.toHaveBeenCalled();
		expect(settingsRepo.upsert).not.toHaveBeenCalled();
	});
});
