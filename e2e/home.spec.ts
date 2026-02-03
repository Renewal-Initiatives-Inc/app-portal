import { test, expect } from '@playwright/test';

// Note: When E2E_TEST_MODE=true, users are auto-authenticated

test.describe('Home Page', () => {
  test('shows home or redirects to login based on auth state', async ({ page }) => {
    await page.goto('/');

    // In E2E test mode, user stays on home (authenticated)
    // In normal mode, user is redirected to login
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByTestId('login-card')).toBeVisible();
    } else {
      // Home page with authenticated user
      await expect(page.getByTestId('portal-title')).toBeVisible();
    }
  });

  test('page maintains app title', async ({ page }) => {
    await page.goto('/');
    // Title should contain "App Portal" or "Renewal Initiatives"
    await expect(page).toHaveTitle(/App Portal|Renewal Initiatives/);
  });

  test('authenticated user sees welcome message', async ({ page }) => {
    await page.goto('/');

    const url = page.url();
    // Only check welcome if on home page (authenticated)
    if (!url.includes('/login')) {
      await expect(page.getByTestId('welcome-heading')).toBeVisible();
    }
  });
});
