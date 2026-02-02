import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when accessing /admin/users', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing /admin/users/invite', async ({
      page,
    }) => {
      await page.goto('/admin/users/invite');
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects to login when accessing user detail page', async ({
      page,
    }) => {
      await page.goto('/admin/users/some-user-id');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // Note: Authenticated tests require storageState setup with admin user session
  // AND Zitadel Management API configuration
  // These tests should be run after setting up proper auth fixtures and Zitadel service account
  // See: https://playwright.dev/docs/auth

  test.describe.skip('Authenticated Admin Access', () => {
    // These tests require:
    // 1. Authentication setup (storage state with admin session)
    // 2. Zitadel Management API configuration (service account credentials)

    test('users page shows heading and invite button', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(
        page.getByRole('heading', { name: 'Users' })
      ).toBeVisible();
      await expect(page.getByTestId('invite-user-button')).toBeVisible();
    });

    test('users page shows table when users exist', async ({ page }) => {
      await page.goto('/admin/users');
      // Either shows table or empty state
      const table = page.getByTestId('users-table');
      const emptyState = page.getByTestId('users-empty-state');
      await expect(table.or(emptyState)).toBeVisible();
    });

    test('invite user button navigates to invite form', async ({ page }) => {
      await page.goto('/admin/users');
      await page.getByTestId('invite-user-button').click();
      await expect(page).toHaveURL(/\/admin\/users\/invite/);
    });

    test('invite form has all required fields', async ({ page }) => {
      await page.goto('/admin/users/invite');
      await expect(page.getByTestId('input-email')).toBeVisible();
      await expect(page.getByTestId('input-first-name')).toBeVisible();
      await expect(page.getByTestId('input-last-name')).toBeVisible();
      await expect(page.getByTestId('checkbox-admin')).toBeVisible();
      await expect(page.getByTestId('submit-invite')).toBeVisible();
    });

    test('invite form validates email', async ({ page }) => {
      await page.goto('/admin/users/invite');
      await page.getByTestId('input-email').fill('invalid-email');
      await page.getByTestId('submit-invite').click();
      // Should show validation error
      await expect(page.getByText(/Invalid email/i)).toBeVisible();
    });

    test('can fill out invite form', async ({ page }) => {
      await page.goto('/admin/users/invite');
      await page.getByTestId('input-email').fill('test@example.com');
      await page.getByTestId('input-first-name').fill('Test');
      await page.getByTestId('input-last-name').fill('User');
      // All fields should have values
      await expect(page.getByTestId('input-email')).toHaveValue(
        'test@example.com'
      );
      await expect(page.getByTestId('input-first-name')).toHaveValue('Test');
      await expect(page.getByTestId('input-last-name')).toHaveValue('User');
    });

    test('admin checkbox can be toggled', async ({ page }) => {
      await page.goto('/admin/users/invite');
      const checkbox = page.getByTestId('checkbox-admin');
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('back button returns to users list', async ({ page }) => {
      await page.goto('/admin/users/invite');
      await page.getByRole('link', { name: /Back to Users/i }).click();
      await expect(page).toHaveURL(/\/admin\/users$/);
    });

    // User Detail/Edit tests
    test('user detail page shows user info', async ({ page }) => {
      // This test assumes a user exists
      await page.goto('/admin/users');
      // Click on first user row actions
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      // Click edit permissions
      await page.getByRole('menuitem', { name: /Edit Permissions/i }).click();
      // Should be on user detail page
      await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/);
      // Should show permissions form
      await expect(page.getByTestId('user-permissions-form')).toBeVisible();
    });

    test('permissions form shows admin toggle', async ({ page }) => {
      await page.goto('/admin/users');
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      await page.getByRole('menuitem', { name: /Edit Permissions/i }).click();
      // Admin toggle should be visible
      await expect(page.getByTestId('switch-admin')).toBeVisible();
    });

    test('permissions form shows save button disabled when no changes', async ({
      page,
    }) => {
      await page.goto('/admin/users');
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      await page.getByRole('menuitem', { name: /Edit Permissions/i }).click();
      // Save button should be disabled when no changes
      await expect(page.getByTestId('submit-permissions')).toBeDisabled();
    });

    // Deactivate user tests
    test('deactivate option available in user actions', async ({ page }) => {
      await page.goto('/admin/users');
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      // Deactivate option should be visible
      await expect(
        page.getByRole('menuitem', { name: /Deactivate User/i })
      ).toBeVisible();
    });

    test('deactivate shows confirmation dialog', async ({ page }) => {
      await page.goto('/admin/users');
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      await page.getByRole('menuitem', { name: /Deactivate User/i }).click();
      // Dialog should appear
      await expect(page.getByTestId('deactivate-user-dialog')).toBeVisible();
      await expect(
        page.getByText(/Are you sure you want to deactivate/i)
      ).toBeVisible();
    });

    test('can cancel deactivation', async ({ page }) => {
      await page.goto('/admin/users');
      const firstUserActions = page.locator('[data-testid^="user-actions-"]').first();
      await firstUserActions.click();
      await page.getByRole('menuitem', { name: /Deactivate User/i }).click();
      // Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click();
      // Dialog should close
      await expect(page.getByTestId('deactivate-user-dialog')).not.toBeVisible();
    });

    // Dashboard integration tests
    test('dashboard shows user count', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByTestId('stat-users')).toBeVisible();
    });

    test('dashboard has quick action for invite user', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByTestId('action-invite-user')).toBeVisible();
    });

    test('dashboard has quick action for view users', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByTestId('action-view-users')).toBeVisible();
    });

    test('dashboard invite user action navigates correctly', async ({
      page,
    }) => {
      await page.goto('/admin');
      await page.getByTestId('action-invite-user').click();
      await expect(page).toHaveURL(/\/admin\/users\/invite/);
    });

    test('dashboard view users action navigates correctly', async ({ page }) => {
      await page.goto('/admin');
      await page.getByTestId('action-view-users').click();
      await expect(page).toHaveURL(/\/admin\/users$/);
    });

    // Navigation tests
    test('users link enabled in admin nav', async ({ page }) => {
      await page.goto('/admin');
      const usersLink = page.getByTestId('nav-users');
      await expect(usersLink).toBeVisible();
      // Should not have disabled styling
      await expect(usersLink).not.toHaveClass(/opacity-50/);
    });

    test('users nav link navigates to users page', async ({ page }) => {
      await page.goto('/admin');
      await page.getByTestId('nav-users').click();
      await expect(page).toHaveURL(/\/admin\/users$/);
    });
  });

  // Tests that can run without Zitadel Management API (UI only)
  test.describe('UI Tests (No Zitadel Required)', () => {
    // These tests verify UI components render correctly
    // They don't require Zitadel Management API to be configured

    test.skip('users page shows configuration warning when Zitadel not configured', async ({
      page,
    }) => {
      // This test would need authentication but no Zitadel Management API config
      // Skip for now as it requires special setup
      await page.goto('/admin/users');
      await expect(page.getByTestId('zitadel-not-configured')).toBeVisible();
    });
  });
});
