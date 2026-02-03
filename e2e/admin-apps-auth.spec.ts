/**
 * Admin Apps Management E2E Tests (with E2E test mode)
 *
 * These tests require E2E_TEST_MODE=true to be set in the environment.
 * The app will use mock authentication when this mode is active.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Apps Management (Authenticated)', () => {
  test('admin dashboard shows app count', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByTestId('stat-apps')).toBeVisible();
  });

  test('app list page shows table', async ({ page }) => {
    await page.goto('/admin/apps');
    await expect(
      page.getByRole('heading', { name: 'Apps' })
    ).toBeVisible();
    await expect(page.getByTestId('add-app-button')).toBeVisible();
  });

  test('add app button navigates to new app form', async ({ page }) => {
    await page.goto('/admin/apps');
    await page.getByTestId('add-app-button').click();
    await expect(page).toHaveURL(/\/admin\/apps\/new/);
  });

  test('new app form has all required fields', async ({ page }) => {
    await page.goto('/admin/apps/new');
    await expect(page.getByTestId('app-name-input')).toBeVisible();
    await expect(page.getByTestId('app-slug-input')).toBeVisible();
    await expect(page.getByTestId('app-description-input')).toBeVisible();
    await expect(page.getByTestId('app-url-input')).toBeVisible();
    await expect(page.getByTestId('submit-app')).toBeVisible();
  });

  test('slug auto-generates from name', async ({ page }) => {
    await page.goto('/admin/apps/new');
    await page.getByTestId('app-name-input').fill('My New App');
    await expect(page.getByTestId('app-slug-input')).toHaveValue('my-new-app');
  });

  test('form validation shows errors for empty fields', async ({ page }) => {
    await page.goto('/admin/apps/new');
    await page.getByTestId('submit-app').click();
    // Form should show validation errors
    await expect(
      page.getByText(/Name must be at least 2 characters/)
    ).toBeVisible();
  });
});
