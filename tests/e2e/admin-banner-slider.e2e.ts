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

async function createBanner(page: Page, title: string, order: number) {
	await page.goto('/admin/banners/new');
	await page.locator('input[name="title"]').fill(title);
	await page.locator('input[name="order"]').fill(String(order));
	await page.locator('input[name="published"]').check();
	await page.getByRole('button', { name: 'Simpan' }).click();
	await page.waitForURL('**/admin/banners');
}

test.describe('public banner slider', () => {
	test('switches between active banners using slide indicators', async ({ page }) => {
		page.on('dialog', (dialog) => dialog.accept());
		await login(page);

		const suffix = Date.now();
		const firstTitle = `Slider A ${suffix}`;
		const secondTitle = `Slider B ${suffix}`;
		await createBanner(page, firstTitle, 9000);
		await createBanner(page, secondTitle, 9001);

		await page.goto('/');
		await page
			.getByRole('button', { name: new RegExp(`Tampilkan banner \\d+: ${secondTitle}`) })
			.click();
		await expect(page.getByRole('heading', { level: 1, name: secondTitle })).toBeVisible();

		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
		await page.mouse.move(0, 0);
		await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(secondTitle, {
			timeout: 8000
		});

		await page.goto('/admin/banners');
		for (const title of [firstTitle, secondTitle]) {
			await page
				.getByRole('row', { name: new RegExp(title) })
				.getByRole('button', { name: 'Hapus' })
				.click();
			await expect(page.getByRole('row', { name: new RegExp(title) })).toHaveCount(0);
		}
	});
});
