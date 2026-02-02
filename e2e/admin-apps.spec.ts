import { test, expect } from '@playwright/test';

test.describe('Admin Apps Management', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when accessing /admin', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing /admin/apps', async ({ page }) => {
      await page.goto('/admin/apps');
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing /admin/apps/new', async ({
      page,
    }) => {
      await page.goto('/admin/apps/new');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // Note: Authenticated tests require storageState setup with admin user session
  // These tests should be run after setting up proper auth fixtures
  // See: https://playwright.dev/docs/auth

  test.describe.skip('Authenticated Admin Access', () => {
    // These tests require authentication setup
    // To enable, create a storage state file with admin session

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

    test('can create a new app', async ({ page }) => {
      await page.goto('/admin/apps/new');
      await page.getByTestId('app-name-input').fill('Test Application');
      await page
        .getByTestId('app-description-input')
        .fill('This is a test application for e2e testing');
      await page
        .getByTestId('app-url-input')
        .fill('https://test.renewalinitiatives.org');
      await page.getByTestId('submit-app').click();

      // Should redirect to apps list
      await expect(page).toHaveURL(/\/admin\/apps$/);
      // Should show success toast
      await expect(page.getByText(/App created successfully/)).toBeVisible();
    });

    test('can edit an existing app', async ({ page }) => {
      // First go to apps list
      await page.goto('/admin/apps');
      // Click edit on first app
      await page.getByTestId('app-actions-test-application').click();
      await page.getByTestId('edit-app-test-application').click();
      await expect(page).toHaveURL(/\/admin\/apps\/.*\/edit/);

      // Modify the name
      await page.getByTestId('app-name-input').clear();
      await page.getByTestId('app-name-input').fill('Updated Test App');
      await page.getByTestId('submit-app').click();

      // Should redirect and show success
      await expect(page).toHaveURL(/\/admin\/apps$/);
      await expect(page.getByText(/App updated successfully/)).toBeVisible();
    });

    test('delete confirmation dialog appears', async ({ page }) => {
      await page.goto('/admin/apps');
      // Click actions for an app
      await page.getByTestId('app-actions-test-application').click();
      await page.getByTestId('delete-app-test-application').click();

      // Dialog should appear
      await expect(page.getByTestId('delete-app-dialog')).toBeVisible();
      await expect(page.getByText(/Are you sure you want to delete/)).toBeVisible();
    });

    test('can cancel delete', async ({ page }) => {
      await page.goto('/admin/apps');
      await page.getByTestId('app-actions-test-application').click();
      await page.getByTestId('delete-app-test-application').click();

      // Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Dialog should close
      await expect(page.getByTestId('delete-app-dialog')).not.toBeVisible();
    });

    test('can delete an app', async ({ page }) => {
      await page.goto('/admin/apps');
      await page.getByTestId('app-actions-test-application').click();
      await page.getByTestId('delete-app-test-application').click();

      // Click confirm delete
      await page.getByTestId('confirm-delete-app').click();

      // Should show success toast
      await expect(page.getByText(/has been deleted/)).toBeVisible();
      // App should no longer be in list
      await expect(
        page.getByTestId('app-row-test-application')
      ).not.toBeVisible();
    });
  });
});
