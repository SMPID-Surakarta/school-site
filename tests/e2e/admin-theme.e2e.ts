import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@sekolah.test';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
const themePath = '/admin/settings/theme';

async function login(page: Page) {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill(EMAIL);
	await page.locator('input[name="password"]').fill(PASSWORD);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForURL('**/admin');
	await page.goto(themePath);
}

test('theme settings require authentication for reads and writes', async ({ page, request }) => {
	await page.goto(themePath);
	await expect(page).toHaveURL(/\/login\?redirectTo=/);
	const response = await request.post(themePath, {
		headers: { Accept: 'text/html', Origin: new URL(page.url()).origin },
		form: { primaryColor: '#16634a', accentColor: '#000000', fontFamily: 'grotesk' },
		maxRedirects: 0
	});
	expect(response.status()).toBe(303);
	expect(response.headers().location).toContain('/login');
});

test('saves, previews and resets the public theme', async ({ page, browser }, testInfo) => {
	await login(page);
	const primary = page.locator('input[name="primaryColor"]');
	const accent = page.locator('input[name="accentColor"]');
	const font = page.locator('select[name="fontFamily"]');
	const previous = {
		primaryColor: await primary.inputValue(),
		accentColor: await accent.inputValue(),
		fontFamily: await font.inputValue()
	};
	const save = async () => {
		await page.getByRole('button', { name: 'Simpan Tema', exact: true }).click();
		await expect(page.getByText('Tema berhasil diperbarui', { exact: true })).toBeVisible();
	};

	try {
		await expect(page.getByRole('link', { name: 'Tema & Warna', exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Hijau Akademik' }).click();
		await accent.fill('#000000');
		await font.selectOption('grotesk');
		await expect(page.locator('[data-theme-preview] h3')).toHaveCSS('color', 'rgb(22, 99, 74)');
		await expect(page.locator('[data-theme-preview]')).toHaveCSS(
			'font-family',
			/Space Grotesk Variable/
		);
		await save();
		await page.reload();
		await expect(primary).toHaveValue('#16634a');
		await expect(accent).toHaveValue('#000000');
		await expect(font).toHaveValue('grotesk');
		await page.setViewportSize({ width: 1440, height: 1050 });
		await page.screenshot({
			path: testInfo.outputPath('theme-desktop.png'),
			fullPage: true,
			animations: 'disabled'
		});

		const visitor = await browser.newContext({ javaScriptEnabled: false });
		try {
			const publicPage = await visitor.newPage();
			await publicPage.goto(new URL('/', page.url()).href);
			const site = publicPage.locator('[data-site-theme]');
			await expect(site).toHaveCSS('--color-primary', '#16634a');
			await expect(site).toHaveCSS('font-family', /Space Grotesk Variable/);
			await expect(publicPage.locator('.eyebrow').first()).toHaveCSS('color', 'rgb(22, 99, 74)');
			const announcement = publicPage.getByRole('complementary', { name: 'Pengumuman penting' });
			if (await announcement.count()) {
				await expect(announcement).toHaveCSS('background-color', 'rgb(0, 0, 0)');
				await expect(announcement).toHaveCSS('color', 'rgb(255, 255, 255)');
			}
		} finally {
			await visitor.close();
		}

		await page.setViewportSize({ width: 390, height: 844 });
		await expect(page.getByRole('heading', { name: 'Tema & Warna', exact: true })).toBeVisible();
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath('theme-mobile.png'),
			fullPage: true,
			animations: 'disabled'
		});
		await primary.fill('#ffffff');
		await expect(page.getByRole('button', { name: 'Simpan Tema', exact: true })).toBeDisabled();
		await expect(page.locator('#primary-error')).toBeVisible();
		await page.getByRole('button', { name: 'Tema bawaan', exact: true }).click();
		await expect(primary).toHaveValue('#1d4e89');
		await expect(accent).toHaveValue('#f2994a');
		await expect(font).toHaveValue('jakarta');
		await save();
		await page.reload();
		await expect(primary).toHaveValue('#1d4e89');
	} finally {
		await primary.fill(previous.primaryColor);
		await accent.fill(previous.accentColor);
		await font.selectOption(previous.fontFamily);
		await save();
	}
});
