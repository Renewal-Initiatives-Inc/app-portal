/**
 * E2E Test Mode Configuration
 *
 * Provides a way to bypass authentication for E2E testing.
 * This is protected by multiple safeguards to prevent accidental production use.
 *
 * SECURITY: This file contains multiple independent kill switches that prevent
 * test mode from ever being active in production, even if misconfigured.
 */

/**
 * Mock user for E2E testing - only used when test mode is active
 */
export const E2E_MOCK_ADMIN_USER = {
  id: 'e2e-test-admin-user',
  name: 'E2E Test Admin',
  email: 'e2e-admin@test.renewalinitiatives.org',
  image: null,
  roles: ['admin', 'app:timesheets', 'app:proposal-rodeo'],
};

/**
 * Check if E2E test mode is enabled.
 *
 * This function has THREE independent safeguards:
 * 1. Returns false if NODE_ENV is 'production'
 * 2. Returns false if VERCEL_ENV is 'production'
 * 3. Only returns true if E2E_TEST_MODE is explicitly 'true'
 *
 * All three conditions must align for test mode to be active.
 */
export function isE2ETestMode(): boolean {
  // SAFEGUARD 1: Never enable in Node production environment
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // SAFEGUARD 2: Never enable in Vercel production deployment
  if (process.env.VERCEL_ENV === 'production') {
    return false;
  }

  // SAFEGUARD 3: Must be explicitly enabled
  return process.env.E2E_TEST_MODE === 'true';
}

/**
 * Get the mock session for E2E testing.
 * Returns null if test mode is not active.
 */
export function getE2EMockSession() {
  if (!isE2ETestMode()) {
    return null;
  }

  return {
    user: E2E_MOCK_ADMIN_USER,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Validate that test mode is not accidentally enabled in production.
 * Call this at build time or app startup.
 *
 * @throws Error if E2E_TEST_MODE is set in a production environment
 */
export function validateTestModeNotInProduction(): void {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';

  if (isProduction && process.env.E2E_TEST_MODE) {
    throw new Error(
      '🚨 SECURITY ERROR: E2E_TEST_MODE environment variable is set in a production environment!\n' +
        'This would bypass authentication and is a critical security vulnerability.\n' +
        'Remove the E2E_TEST_MODE environment variable from your production configuration.'
    );
  }
}
