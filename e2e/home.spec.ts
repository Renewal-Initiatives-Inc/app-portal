import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page maintains title', async ({ page }) => {
    await page.goto('/');
    // After redirect, should still have the app title
    await expect(page).toHaveTitle(/App Portal/);
  });

  // Future: Add authenticated home page tests using storageState
  // These will be added in Phase 3 when we implement authenticated testing
});
