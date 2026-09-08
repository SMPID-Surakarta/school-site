import { expect, test } from '@playwright/test';

test.describe('admin authentication guard', () => {
	test('unauthenticated access to /admin redirects to /login', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login/);
		await expect(page).toHaveURL(/redirectTo=%2Fadmin/);
	});

	test('admin sub-routes redirect unauthenticated users to /login', async ({ page }) => {
		await page.goto('/admin/posts');
		await expect(page).toHaveURL(/\/login/);
	});

	test('login page renders the credentials form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: 'Masuk ke Dashboard' })).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
	});

	test('invalid credentials keep the user on the login page', async ({ page }) => {
		await page.goto('/login');
		await page.locator('input[name="email"]').fill('wrong@sekolah.test');
		await page.locator('input[name="password"]').fill('wrong-password');
		await page.getByRole('button', { name: 'Masuk' }).click();
		await expect(page).toHaveURL(/\/login/);
	});
});
