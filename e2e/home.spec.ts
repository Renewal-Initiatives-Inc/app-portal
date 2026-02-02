import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/App Portal/);
});

test('home page displays sign in button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('home page displays heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'App Portal' })).toBeVisible();
});
