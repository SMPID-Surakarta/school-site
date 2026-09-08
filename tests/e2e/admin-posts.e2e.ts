import { expect, test, type Page } from '@playwright/test';

/**
 * Authenticated admin CRUD flow for Posts (create → list → update → soft-delete).
 * Requires a seeded ADMIN account. Credentials default to the seed-admin.ts values
 * and can be overridden via SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 *
 * Seed first:  bun run scripts/seed-admin.ts
 */
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@sekolah.test';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

async function login(page: Page) {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill(EMAIL);
	await page.locator('input[name="password"]').fill(PASSWORD);
	await page.getByRole('button', { name: 'Masuk' }).click();
	await page.waitForURL('**/admin');
}

test.describe('admin posts CRUD', () => {
	test('create, list, update and soft-delete a post', async ({ page }) => {
		await login(page);

		const title = `E2E Berita ${Date.now()}`;
		const updatedTitle = `${title} (edit)`;

		// Create
		await page.goto('/admin/posts');
		await page.getByRole('link', { name: 'Berita Baru' }).click();
		await page.locator('input[name="title"]').fill(title);
		// Konten diisi lewat editor TipTap (contenteditable), bukan textarea.
		await page.locator('.ProseMirror').fill('Konten berita uji e2e.');
		await page.getByRole('button', { name: 'Simpan' }).click();

		// List (judul dirender sebagai link edit di kolom judul)
		await page.waitForURL('**/admin/posts');
		await expect(page.getByRole('link', { name: title })).toBeVisible();

		// Update
		await page
			.getByRole('row', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
			.getByRole('link', { name: 'Edit' })
			.click();
		await page.locator('input[name="title"]').fill(updatedTitle);
		await page.getByRole('button', { name: 'Perbarui' }).click();
		await page.waitForURL('**/admin/posts');
		await expect(page.getByRole('link', { name: updatedTitle })).toBeVisible();

		// Soft-delete: cancel first (post must stay), then confirm via the modal.
		const row = page.getByRole('row', {
			name: new RegExp(updatedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		});
		const modal = page.getByRole('dialog');

		await row.getByRole('button', { name: 'Hapus', exact: true }).click();
		await modal.getByRole('button', { name: 'Batal' }).click();
		await expect(page.getByRole('link', { name: updatedTitle })).toBeVisible();

		await row.getByRole('button', { name: 'Hapus', exact: true }).click();
		await modal.getByRole('button', { name: 'Hapus', exact: true }).click();
		await expect(page.getByRole('link', { name: updatedTitle })).toHaveCount(0);
	});
});
