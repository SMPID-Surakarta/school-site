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

test.describe('admin menu builder', () => {
	test('adds a custom item, shows it on the public nav, then removes it', async ({ page }) => {
		await login(page);
		await page.goto('/admin/menus');

		const testTitle = `Menu E2E ${Date.now()}`;

		// Add a custom link via the left panel and save.
		await page.getByPlaceholder('Profil Sekolah').fill(testTitle);
		await page.getByPlaceholder('/profil atau https://…').fill('/berita');
		await page.getByRole('button', { name: 'Tambah ke Menu' }).click();
		await expect(page.getByRole('button', { name: testTitle, exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Simpan Menu' }).click();
		await expect(page.getByText('Menu navigasi berhasil disimpan')).toBeVisible();

		// The saved item appears in the public main navigation.
		await page.goto('/');
		await expect(
			page
				.getByRole('navigation', { name: 'Navigasi utama' })
				.getByRole('link', { name: testTitle })
		).toBeVisible();

		// Cleanup: delete the item and save again.
		await page.goto('/admin/menus');
		await page.getByRole('button', { name: `Hapus ${testTitle}` }).click();
		await page.getByRole('button', { name: 'Simpan Menu' }).click();
		await expect(page.getByText('Menu navigasi berhasil disimpan')).toBeVisible();

		await page.goto('/');
		await expect(
			page
				.getByRole('navigation', { name: 'Navigasi utama' })
				.getByRole('link', { name: testTitle })
		).toHaveCount(0);
	});
});
