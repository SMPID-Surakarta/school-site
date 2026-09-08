import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@sekolah.test';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

async function login(page: Page) {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill(EMAIL);
	await page.locator('input[name="password"]').fill(PASSWORD);
	await page.getByRole('button', { name: 'Masuk' }).click();
	await page.waitForURL('**/admin');
}

test.describe('admin landing page', () => {
	test('updates the hero fallback title configuration', async ({ page }) => {
		await login(page);
		await page.goto('/admin/landing-page');

		const titleInput = page.locator('input[name="heroTitle"]');
		const previousTitle = await titleInput.inputValue();
		const testTitle = `Landing Page E2E ${Date.now()}`;

		await titleInput.fill(testTitle);
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();

		await page.goto('/admin/landing-page');
		await expect(page.locator('input[name="heroTitle"]')).toHaveValue(testTitle);
		await page.locator('input[name="heroTitle"]').fill(previousTitle);
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();
	});

	test('updates the announcement panel with non-PPDB content', async ({ page }) => {
		await login(page);
		await page.goto('/admin/landing-page');
		await page.getByRole('tab', { name: 'Pengumuman' }).click();

		const labelInput = page.locator('input[name="announcementLabel"]');
		const titleInput = page.locator('input[name="announcementTitle"]');
		const textInput = page.locator('input[name="announcementCtaText"]');
		const urlInput = page.locator('input[name="announcementCtaUrl"]');
		const previousLabel = await labelInput.inputValue();
		const previousTitle = await titleInput.inputValue();
		const previousText = await textInput.inputValue();
		const previousUrl = await urlInput.inputValue();
		const testTitle = `Libur sekolah ${Date.now()}`;
		const testText = 'Baca pengumuman';

		await labelInput.fill('PENGUMUMAN');
		await titleInput.fill(testTitle);
		await textInput.fill(testText);
		await urlInput.fill('/berita');
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();

		await page.goto('/');
		await expect(page.getByText(testTitle)).toBeVisible();
		await expect(page.getByRole('link', { name: testText })).toHaveAttribute('href', '/berita');

		await page.goto('/admin/landing-page');
		await page.getByRole('tab', { name: 'Pengumuman' }).click();
		await page.locator('input[name="announcementLabel"]').fill(previousLabel);
		await page.locator('input[name="announcementTitle"]').fill(previousTitle);
		await page.locator('input[name="announcementCtaText"]').fill(previousText);
		await page.locator('input[name="announcementCtaUrl"]').fill(previousUrl);
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();
	});

	test('updates a facility shown in the landing-page grid', async ({ page }) => {
		await login(page);
		await page.goto('/admin/landing-page');
		await page.getByRole('tab', { name: 'Fasilitas' }).click();

		const showFacilities = page.locator('input[name="showFacilities"]');
		const sectionTitleInput = page.locator('input[name="facilitiesTitle"]');
		const facilityTitleInput = page.locator('input[name="facilities[0].title"]');
		const facilityDescriptionInput = page.locator('textarea[name="facilities[0].description"]');
		const wasVisible = await showFacilities.isChecked();
		const previousSectionTitle = await sectionTitleInput.inputValue();
		const previousFacilityTitle = await facilityTitleInput.inputValue();
		const previousFacilityDescription = await facilityDescriptionInput.inputValue();
		const testSectionTitle = `Fasilitas Unggulan ${Date.now()}`;
		const testFacilityTitle = `Lab Industri ${Date.now()}`;

		await showFacilities.check();
		await sectionTitleInput.fill(testSectionTitle);
		await facilityTitleInput.fill(testFacilityTitle);
		await facilityDescriptionInput.fill('Peralatan praktik yang mendukung pembelajaran siswa.');
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();

		await page.goto('/');
		await expect(page.getByRole('heading', { level: 2, name: testSectionTitle })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: testFacilityTitle })).toBeVisible();

		await page.goto('/admin/landing-page');
		await page.getByRole('tab', { name: 'Fasilitas' }).click();
		if (!wasVisible) await page.locator('input[name="showFacilities"]').uncheck();
		await page.locator('input[name="facilitiesTitle"]').fill(previousSectionTitle);
		await page.locator('input[name="facilities[0].title"]').fill(previousFacilityTitle);
		await page
			.locator('textarea[name="facilities[0].description"]')
			.fill(previousFacilityDescription);
		await page.getByRole('button', { name: 'Simpan Landing Page' }).click();
		await expect(page.getByText('Landing page berhasil diperbarui')).toBeVisible();
	});
});
