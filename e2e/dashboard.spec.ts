import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.describe('unauthenticated user', () => {
    test('redirects to login page', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated user', () => {
    // Note: These tests require authentication setup
    // For full E2E testing, configure test users in Zitadel

    test.skip('displays welcome message with user name', async ({ page }) => {
      // TODO: Implement auth setup for E2E tests
      await page.goto('/');
      await expect(page.getByTestId('welcome-heading')).toContainText(
        'Welcome'
      );
    });

    test.skip('displays app grid when user has authorized apps', async ({
      page,
    }) => {
      // TODO: Implement auth setup with admin user
      await page.goto('/');
      await expect(page.getByTestId('app-grid')).toBeVisible();
    });

    test.skip('displays empty state when user has no apps', async ({
      page,
    }) => {
      // TODO: Implement auth setup with no-access user
      await page.goto('/');
      await expect(page.getByTestId('empty-state')).toBeVisible();
    });

    test.skip('app card links to correct URL', async ({ page }) => {
      // TODO: Implement auth setup with admin user
      await page.goto('/');
      const appCard = page.getByTestId('app-card-timesheets');
      await expect(appCard).toHaveAttribute(
        'href',
        'https://timesheets.renewalinitiatives.org'
      );
    });
  });

  test.describe('responsive layout', () => {
    test('login page displays portal title', async ({ page }) => {
      await page.goto('/login');
      // Can test login page elements without auth
      await expect(page.getByTestId('login-card')).toBeVisible();
      await expect(page.getByText('App Portal')).toBeVisible();
    });
  });
});
