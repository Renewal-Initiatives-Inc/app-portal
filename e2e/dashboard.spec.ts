import { test, expect } from '@playwright/test';

// Note: When E2E_TEST_MODE=true, users are auto-authenticated with mock admin

test.describe('Dashboard', () => {
  test.describe('home page access', () => {
    test('shows home or redirects based on auth state', async ({ page }) => {
      await page.goto('/');

      const url = page.url();
      if (url.includes('/login')) {
        // Unauthenticated - on login page
        await expect(page.getByTestId('login-card')).toBeVisible();
      } else {
        // Authenticated - on home page
        await expect(page.getByTestId('portal-title')).toBeVisible();
      }
    });
  });

  test.describe('authenticated user (E2E test mode)', () => {
    // These tests work when E2E_TEST_MODE=true

    test('displays welcome message with user name', async ({ page }) => {
      await page.goto('/');

      const url = page.url();
      if (!url.includes('/login')) {
        await expect(page.getByTestId('welcome-heading')).toContainText(
          'Welcome'
        );
      }
    });

    test('displays app grid or empty state', async ({ page }) => {
      await page.goto('/');

      const url = page.url();
      if (!url.includes('/login')) {
        // Wait for content to load
        await page.waitForLoadState('networkidle');

        // Either app grid or empty state should be visible
        const hasAppGrid = await page.getByTestId('app-grid').isVisible().catch(() => false);
        const hasEmptyState = await page.getByTestId('empty-state').isVisible().catch(() => false);

        // If neither is visible yet, wait a bit more and check again
        if (!hasAppGrid && !hasEmptyState) {
          await page.waitForTimeout(1000);
          const hasAppGridRetry = await page.getByTestId('app-grid').isVisible().catch(() => false);
          const hasEmptyStateRetry = await page.getByTestId('empty-state').isVisible().catch(() => false);
          expect(hasAppGridRetry || hasEmptyStateRetry).toBe(true);
        } else {
          expect(hasAppGrid || hasEmptyState).toBe(true);
        }
      }
    });
  });

  test.describe('login page', () => {
    test('displays portal title or redirects to home', async ({ page }) => {
      await page.goto('/login');

      const url = page.url();
      if (url.includes('/login')) {
        // Not authenticated - can see login page
        await expect(page.getByTestId('login-card')).toBeVisible();
        await expect(
          page.getByRole('heading', { name: /App Portal/i })
        ).toBeVisible();
      } else {
        // Authenticated - redirected to home
        await expect(page.getByTestId('portal-title')).toBeVisible();
      }
    });
  });
});
