/**
 * Auth fixtures for E2E testing
 *
 * These fixtures rely on E2E_TEST_MODE being set in the environment.
 * The app's auth system will return mock sessions when this mode is active.
 *
 * SECURITY: Test mode has multiple safeguards and cannot activate in production.
 * See src/lib/test-mode.ts for details.
 */

import { test as base } from '@playwright/test';

// Re-export expect for convenience
export { expect } from '@playwright/test';

// Extended test that documents the auth context
// The actual auth bypass happens server-side via E2E_TEST_MODE env var
export const test = base.extend({
  // No special setup needed - the server handles mock auth
  // when E2E_TEST_MODE=true is set
});

/**
 * Note: The mock user data is defined in src/lib/test-mode.ts
 *
 * Default mock admin user:
 * - id: 'e2e-test-admin-user'
 * - name: 'E2E Test Admin'
 * - email: 'e2e-admin@test.renewalinitiatives.org'
 * - roles: ['admin', 'app:timesheets', 'app:proposal-rodeo']
 */
