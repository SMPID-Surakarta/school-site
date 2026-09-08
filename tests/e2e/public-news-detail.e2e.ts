import { expect, test, type Page } from '@playwright/test';

async function openPost(page: Page) {
	await page.goto('/berita');
	const firstPost = page.locator('main a[href*="/berita/"]').first();
	await expect(firstPost).toBeVisible();
	await firstPost.click();
	await expect(page.locator('#post-title')).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
}

test.describe('public news detail', () => {
	test.use({ baseURL: 'http://localhost:4173' });

	for (const width of [390, 768, 1440, 1920]) {
		test(`detail columns, image and related articles at ${width}px`, async ({ page }, testInfo) => {
			await page.setViewportSize({ width, height: 900 });
			const errors: string[] = [];
			page.on('pageerror', (error) => errors.push(error.message));
			await openPost(page);
			const article = page.getByRole('article');
			const sidebar = page.getByRole('complementary', { name: 'Sidebar berita' });
			const articleBounds = (await article.boundingBox())!;
			const sidebarBounds = (await sidebar.boundingBox())!;
			const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
			await expect(breadcrumb.getByRole('link', { name: 'Beranda', exact: true })).toHaveAttribute(
				'href',
				'/'
			);
			await expect(breadcrumb.getByRole('link', { name: 'Berita', exact: true })).toHaveAttribute(
				'href',
				'/berita'
			);
			await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
				await page.locator('#post-title').innerText()
			);
			const related = page.getByRole('region', { name: 'Artikel Terkait', exact: true });
			const sidebarLinks = await sidebar
				.locator('ol a')
				.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
			expect(sidebarLinks.length).toBeLessThanOrEqual(4);
			expect(sidebarLinks).not.toContain(new URL(page.url()).pathname);
			expect(
				await related
					.locator('a[href*="/berita/"]')
					.evaluateAll((links) => links.map((link) => link.getAttribute('href')))
			).toEqual(sidebarLinks);
			expect((await related.boundingBox())!.y).toBeGreaterThanOrEqual(
				articleBounds.y + articleBounds.height
			);

			if (width >= 1024) {
				expect(sidebarBounds.x).toBeGreaterThan(articleBounds.x + articleBounds.width);
				const ratio = articleBounds.width / (articleBounds.width + sidebarBounds.width);
				expect(ratio).toBeGreaterThanOrEqual(0.65);
				expect(ratio).toBeLessThanOrEqual(0.7);
				await page.evaluate(() => window.scrollTo(0, 600));
				await expect
					.poll(() =>
						sidebar.evaluate((element) =>
							Math.abs(
								element.getBoundingClientRect().top - parseFloat(getComputedStyle(element).top)
							)
						)
					)
					.toBeLessThanOrEqual(1);
				expect((await sidebar.boundingBox())!.y).toBeGreaterThanOrEqual(
					(await page.getByRole('banner').boundingBox())!.height
				);
			} else {
				expect(sidebarBounds.y).toBeGreaterThanOrEqual(articleBounds.y + articleBounds.height);
				expect(sidebarBounds.width).toBeCloseTo(articleBounds.width, 0);
				expect(await sidebar.evaluate((element) => getComputedStyle(element).position)).toBe(
					'static'
				);
			}

			const image = article.locator('figure > img');
			if (await image.count()) {
				await expect
					.poll(() =>
						image.evaluate(
							(element: HTMLImageElement) => element.complete && element.naturalWidth > 0
						)
					)
					.toBe(true);
				const alt = (await image.getAttribute('alt'))?.trim() ?? '';
				if (alt) await expect(article.locator('figcaption')).toHaveText(alt);
				else await expect(article.locator('figcaption')).toHaveCount(0);
			}
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
				await page.evaluate(() => document.documentElement.clientWidth)
			);
			await page.evaluate(() => window.scrollTo(0, 0));
			await page.screenshot({
				path: testInfo.outputPath(`post-detail-${width}.png`),
				animations: 'disabled'
			});
			if (width === 390) {
				await sidebar.scrollIntoViewIfNeeded();
				await page.screenshot({
					path: testInfo.outputPath('post-sidebar-mobile.png'),
					animations: 'disabled'
				});
			}
			expect(errors).toEqual([]);
		});
	}

	test('shares canonical URLs, copies links and provides a clipboard failure fallback', async ({
		page
	}) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: {
					writeText: async (value: string) => {
						document.documentElement.dataset.copiedLink = value;
					}
				}
			});
		});
		await openPost(page);
		await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
		const canonical = (await page.locator('link[rel="canonical"]').getAttribute('href'))!;
		const title = await page.locator('#post-title').innerText();
		const whatsapp = new URL(
			(await page.getByRole('link', { name: 'Bagikan ke WhatsApp' }).getAttribute('href'))!
		);
		const facebook = new URL(
			(await page.getByRole('link', { name: 'Bagikan ke Facebook' }).getAttribute('href'))!
		);
		expect(whatsapp.searchParams.get('text')).toBe(`${title}\n${canonical}`);
		expect(facebook.searchParams.get('u')).toBe(canonical);
		await page.getByRole('button', { name: 'Salin tautan', exact: true }).click();
		await expect(page.getByRole('status')).toHaveText('Tautan tersalin.');
		await expect(page.locator('html')).toHaveAttribute('data-copied-link', canonical);
		await page.evaluate(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: {
					writeText: async () => {
						throw new Error('Clipboard unavailable');
					}
				}
			});
		});
		await page.getByRole('button', { name: 'Salin tautan', exact: true }).click();
		await expect(page.getByRole('status')).toHaveText('Gagal menyalin tautan.');
		await expect(page.getByRole('textbox', { name: 'Tautan artikel' })).toHaveValue(canonical);
	});

	test('sidebar search and category navigation lead to working public listings', async ({
		page
	}) => {
		await openPost(page);
		const postUrl = page.url();
		const search = page.getByRole('search', { name: 'Cari berita' });
		await search.getByRole('searchbox').fill('sekolah');
		await search.getByRole('button', { name: 'Cari', exact: true }).click();
		await expect(page).toHaveURL(/\/search\?q=sekolah$/);
		await expect(page.getByRole('heading', { name: 'Pencarian', exact: true })).toBeVisible();
		await page.goto(postUrl);
		const categoryLink = page.getByRole('complementary').locator('a[href*="?category="]').first();
		await expect(categoryLink).toBeVisible();
		const name = (await categoryLink.innerText()).trim();
		await categoryLink.click();
		await expect(page).toHaveURL(/\/berita\?category=/);
		await expect(page.getByRole('heading', { name, level: 2, exact: true })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Semua kategori', exact: true })).toBeVisible();
	});
});
