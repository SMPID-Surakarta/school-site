import { expect, test } from '@playwright/test';

test.describe('public responsive layout', () => {
	test.use({ baseURL: 'http://localhost:4173' });

	for (const width of [390, 1440]) {
		test(`navbar stays sticky and responds to scrolling at ${width}px`, async ({
			page
		}, testInfo) => {
			await page.setViewportSize({ width, height: 844 });
			await page.goto('/');
			const header = page.getByRole('banner');
			await expect(header).toHaveAttribute('data-scrolled', 'false');
			const initialHeight = (await header.boundingBox())!.height;
			await page.evaluate(() => window.scrollTo(0, 650));
			await expect(header).toHaveAttribute('data-scrolled', 'true');
			await expect.poll(async () => (await header.boundingBox())!.y).toBe(0);
			expect((await header.boundingBox())!.height).toBe(initialHeight);
			await page.screenshot({
				path: testInfo.outputPath(`navbar-${width}.png`),
				animations: 'disabled'
			});
			await page.evaluate(() => window.scrollTo(0, 0));
			await expect(header).toHaveAttribute('data-scrolled', 'false');
		});
	}

	test('sticky mobile navigation closes on Escape, outside click and navigation', async ({
		page
	}, testInfo) => {
		await page.setViewportSize({ width: 390, height: 600 });
		await page.goto('/');
		await page.evaluate(() => window.scrollTo(0, 500));
		const toggle = page.getByRole('button', { name: 'Buka menu', exact: true });
		const menu = page.getByRole('navigation', { name: 'Navigasi utama (mobile)', exact: true });
		await toggle.click();
		await expect(menu).toBeVisible();
		const bounds = (await menu.boundingBox())!;
		expect(bounds.y + bounds.height).toBeLessThanOrEqual(600);
		await page.screenshot({
			path: testInfo.outputPath('navbar-mobile-open.png'),
			animations: 'disabled'
		});
		await page.keyboard.press('Escape');
		await expect(menu).not.toBeVisible();
		await expect(toggle).toBeFocused();
		await toggle.click();
		await page.mouse.click(5, 590);
		await expect(menu).not.toBeVisible();
		await toggle.click();
		const destinationLink = menu.locator('a[href^="/"]:not([href="/"])').first();
		const destination = await destinationLink.getAttribute('href');
		expect(destination).toBeTruthy();
		const destinationUrl = new URL(destination!, page.url()).href;
		await destinationLink.click();
		await expect(page).toHaveURL(destinationUrl);
		await expect(menu).not.toBeVisible();
		await toggle.click();
		await expect(menu.locator(`a[href="${destination}"]`).first()).toHaveAttribute(
			'aria-current',
			'page'
		);
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect(menu).toHaveCount(0);
		await page.setViewportSize({ width: 390, height: 600 });
		await expect(menu).not.toBeVisible();
	});

	for (const width of [360, 768, 1024, 1280, 1440, 1920, 2560]) {
		test(`containers stay centered and bounded at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });

			for (const path of ['/', '/berita', '/galeri', '/kontak']) {
				await page.goto(path);
				await expect(page.locator('#konten-utama')).toBeVisible();
				await page.evaluate(() => document.fonts.ready);

				const layout = await page.evaluate(() => ({
					viewport: document.documentElement.clientWidth,
					scrollWidth: document.documentElement.scrollWidth,
					containers: Array.from(document.querySelectorAll('.max-w-public'))
						.filter((element) => element.getClientRects().length > 0)
						.map((element) => {
							const { x, width } = element.getBoundingClientRect();
							return { x, width };
						}),
					textWidths: Array.from(
						document.querySelectorAll('main .max-w-xl, main .max-w-2xl, main .max-w-3xl')
					).map((element) => ({
						width: element.getBoundingClientRect().width,
						limit: element.classList.contains('max-w-xl')
							? 576
							: element.classList.contains('max-w-2xl')
								? 672
								: 768
					}))
				}));

				expect(layout.scrollWidth, `${path}: horizontal overflow`).toBe(layout.viewport);
				expect(layout.containers.length).toBeGreaterThanOrEqual(3);
				for (const container of layout.containers) {
					expect(container.width, `${path}: container width`).toBe(Math.min(width, 1320));
					expect(container.x, `${path}: centered container`).toBeCloseTo(
						(layout.viewport - container.width) / 2,
						0
					);
				}
				for (const text of layout.textWidths) {
					expect(text.width, `${path}: readable text width`).toBeLessThanOrEqual(text.limit);
				}
			}
		});
	}
});
