import { expect, test } from '@playwright/test';

test.describe('public site', () => {
	test('home page renders with primary navigation', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('header')).toBeVisible();
		// Menu is admin-managed (WordPress-style) — assert the nav renders with at least one link.
		const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
		await expect(nav).toBeVisible();
		expect(await nav.getByRole('link').count()).toBeGreaterThan(0);
	});

	test('news listing is reachable', async ({ page }) => {
		await page.goto('/berita');
		await expect(page.getByRole('heading', { level: 1, name: 'Berita' })).toBeVisible();
	});

	test('search page performs a query without server error', async ({ page }) => {
		await page.goto('/search');
		await page.getByRole('searchbox').fill('sekolah');
		await page.getByRole('button', { name: 'Cari' }).click();
		await expect(page).toHaveURL(/\/search\?q=sekolah/);
		await expect(page.getByRole('heading', { level: 1, name: 'Pencarian' })).toBeVisible();
	});

	test('contact form submits a valid message', async ({ page }) => {
		await page.goto('/kontak');
		await page.locator('input[name="name"]').fill('Pengunjung E2E');
		await page.locator('input[name="email"]').fill('pengunjung@example.com');
		await page.locator('textarea[name="message"]').fill('Halo, ini pesan pengujian otomatis.');

		// The POST to the form action must succeed (2xx) — proves form → service → DB insert.
		const [response] = await Promise.all([
			page.waitForResponse((r) => r.url().includes('/kontak') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Kirim Pesan' }).click()
		]);
		expect(response.status()).toBeLessThan(400);
	});

	test('robots.txt and sitemap.xml are served', async ({ request }) => {
		const robots = await request.get('/robots.txt');
		expect(robots.ok()).toBeTruthy();
		expect(await robots.text()).toContain('Sitemap:');

		const sitemap = await request.get('/sitemap.xml');
		expect(sitemap.ok()).toBeTruthy();
		expect(await sitemap.text()).toContain('<urlset');
	});
});
