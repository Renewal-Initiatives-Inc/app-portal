import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-card')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('login page displays correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId('login-card')).toBeVisible();
    await expect(page.getByText('App Portal')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toHaveText(
      'Sign in with Zitadel'
    );
  });

  test('login page has proper structure', async ({ page }) => {
    await page.goto('/login');

    // Card should have description
    await expect(
      page.getByText('Sign in to access Renewal Initiatives tools')
    ).toBeVisible();

    // Button should be full width and clickable
    const loginButton = page.getByTestId('login-submit');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('auth error page displays error message', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');

    await expect(page.getByTestId('auth-error-alert')).toBeVisible();
    await expect(page.getByText('Authentication Error')).toBeVisible();
    await expect(
      page.getByText('You do not have permission to sign in.')
    ).toBeVisible();
    await expect(page.getByTestId('auth-error-retry')).toBeVisible();
  });

  test('auth error page handles default error', async ({ page }) => {
    await page.goto('/auth/error');

    await expect(page.getByTestId('auth-error-alert')).toBeVisible();
    await expect(
      page.getByText('An error occurred during authentication.')
    ).toBeVisible();
  });

  test('auth error retry link goes to login', async ({ page }) => {
    await page.goto('/auth/error');

    await page.getByTestId('auth-error-retry').click();
    await expect(page).toHaveURL(/\/login/);
  });
});
