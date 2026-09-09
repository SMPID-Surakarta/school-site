import { expect, test, type Page } from '@playwright/test';
import { defaultTheme, themeStyle } from '../../src/lib/utils/theme';

test.use({ baseURL: 'http://localhost:4173' });

async function renderedTheme(page: Page) {
	return page.locator('[data-site-theme]').evaluate((site) => {
		const style = getComputedStyle(site);
		const probe = document.createElement('span');
		probe.style.color = 'var(--color-primary)';
		probe.style.backgroundColor = 'var(--color-bg-subtle)';
		probe.style.borderColor = 'var(--color-line)';
		site.append(probe);
		const probeStyle = getComputedStyle(probe);
		const result = {
			primary: style.getPropertyValue('--color-primary').trim(),
			color: probeStyle.color,
			background: probeStyle.backgroundColor,
			border: probeStyle.borderColor,
			font: style.fontFamily
		};
		probe.remove();
		return result;
	});
}

for (const width of [390, 1440]) {
	test(`saved theme reaches public pages and news navigation at ${width}px`, async ({
		page
	}, testInfo) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		const saved = await renderedTheme(page);

		for (const path of ['/berita', '/faq', '/galeri', '/prestasi', '/agenda', '/guru', '/kontak']) {
			await page.goto(path);
			await expect.poll(() => renderedTheme(page), { message: path }).toEqual(saved);
			const theme = saved;
			await expect(page.locator('main .eyebrow').first()).toHaveCSS('color', theme.color);
			await expect(page.locator('main .bg-bg-subtle').first()).toHaveCSS(
				'background-color',
				theme.background
			);
			await expect(page.locator('main .border-line').first()).toHaveCSS(
				'border-bottom-color',
				theme.border
			);
		}

		await page.goto('/berita');
		await page.locator('main a[href*="/berita/"]').first().click();
		await expect(page.locator('#post-title')).toBeVisible();
		expect(await renderedTheme(page)).toEqual(saved);
		await expect(page.getByRole('button', { name: 'Cari', exact: true })).toHaveCSS(
			'background-color',
			saved.color
		);
		await expect(page.locator('.post-content')).toHaveCSS('--tw-prose-links', saved.primary);
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath(`news-theme-${width}.png`),
			animations: 'disabled'
		});
	});
}

test('CMS typography follows theme tokens without affecting the admin theme', async ({ page }) => {
	await page.goto('/ppdb');
	const content = page.locator('.page-content');
	await expect(content).toBeVisible();
	const basePrimary = await page
		.locator('html')
		.evaluate((element) => getComputedStyle(element).getPropertyValue('--color-primary').trim());

	for (const primaryColor of ['#16634a', '#9f253a']) {
		await page.locator('[data-site-theme]').evaluate(
			(element, style) => {
				element.setAttribute('style', style);
			},
			themeStyle({ ...defaultTheme, primaryColor, accentColor: '#000000', fontFamily: 'grotesk' })
		);
		await expect(content).toHaveCSS('--tw-prose-links', primaryColor);
		await expect(content).toHaveCSS('--tw-prose-quote-borders', '#000000');
		await expect(content).toHaveCSS('font-family', /Space Grotesk Variable/);
		const colors = await content.evaluate((element) => {
			const link = document.createElement('a');
			link.href = '#theme-test';
			link.textContent = 'Tautan';
			const quote = document.createElement('blockquote');
			quote.textContent = 'Kutipan';
			element.append(link, quote);
			const result = {
				link: getComputedStyle(link).color,
				border: getComputedStyle(quote).borderLeftColor
			};
			link.remove();
			quote.remove();
			return result;
		});
		expect(colors.link).toBe((await renderedTheme(page)).color);
		expect(colors.border).toBe('rgb(0, 0, 0)');
		await expect(page.locator('html')).toHaveCSS('--color-primary', basePrimary);
	}
});
