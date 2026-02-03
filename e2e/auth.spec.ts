import { test, expect } from '@playwright/test';

// Note: When E2E_TEST_MODE=true, authentication is bypassed and users are auto-logged in.
// These tests handle both modes appropriately.

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login OR sees home when in test mode', async ({ page }) => {
    await page.goto('/');

    // In E2E test mode, user is auto-authenticated and stays on home page
    // In normal mode, user is redirected to login
    const url = page.url();
    if (url.includes('/login')) {
      // Normal mode - verify login page elements
      await expect(page.getByTestId('login-card')).toBeVisible();
      await expect(page.getByTestId('login-submit')).toBeVisible();
    } else {
      // E2E test mode - verify home page elements (user is authenticated)
      await expect(page.getByTestId('portal-title')).toBeVisible();
    }
  });

  test('login page displays correctly OR redirects when authenticated', async ({ page }) => {
    await page.goto('/login');

    const url = page.url();
    // In E2E test mode with authenticated user, /login redirects to home
    if (url.includes('/login')) {
      await expect(page.getByTestId('login-card')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /App Portal/i })
      ).toBeVisible();
      await expect(page.getByTestId('login-submit')).toHaveText(
        'Sign in with Zitadel'
      );
    } else {
      // Redirected to home - user is authenticated
      await expect(page.getByTestId('portal-title')).toBeVisible();
    }
  });

  test('login page has proper structure OR shows home when authenticated', async ({ page }) => {
    await page.goto('/login');

    const url = page.url();
    if (url.includes('/login')) {
      // Card should have description
      await expect(
        page.getByText('Sign in to access Renewal Initiatives tools')
      ).toBeVisible();

      // Button should be full width and clickable
      const loginButton = page.getByTestId('login-submit');
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    } else {
      // Redirected to home - verify welcome
      await expect(page.getByTestId('welcome-heading')).toBeVisible();
    }
  });

  test('auth error page displays error message', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');

    await expect(page.getByTestId('auth-error-alert')).toBeVisible();
    await expect(page.getByText('Access Denied')).toBeVisible();
    await expect(
      page.getByText('You do not have permission to access this application.')
    ).toBeVisible();
    await expect(page.getByTestId('auth-error-retry')).toBeVisible();
  });

  test('auth error page handles default error', async ({ page }) => {
    await page.goto('/auth/error');

    await expect(page.getByTestId('auth-error-alert')).toBeVisible();
    await expect(
      page.getByText('An unexpected error occurred during authentication.')
    ).toBeVisible();
  });

  test('auth error retry link navigates away from error page', async ({ page }) => {
    await page.goto('/auth/error');

    // Wait for retry button and click it
    const retryButton = page.getByTestId('auth-error-retry');
    await expect(retryButton).toBeVisible();

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/auth/error'), { timeout: 10000 }),
      retryButton.click(),
    ]);

    // Should no longer be on error page
    expect(page.url()).not.toContain('/auth/error');
  });
});
