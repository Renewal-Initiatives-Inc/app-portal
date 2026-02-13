import { describe, it, expect } from 'vitest';

/**
 * Tests for the signIn gate logic added to auth.ts.
 * The signIn callback uses extractRoles() to get roles from the profile,
 * then checks for 'admin' or 'app:app-portal' before allowing login.
 *
 * This mirrors the exact logic used in the signIn callback and extractRoles.
 */

const ZITADEL_ROLES_CLAIM_GENERIC = 'urn:zitadel:iam:org:project:roles';

// Mirror of extractRoles from auth.ts
function extractRoles(profile: Record<string, unknown>): string[] {
  const rolesClaim = profile[ZITADEL_ROLES_CLAIM_GENERIC];
  if (!rolesClaim || typeof rolesClaim !== 'object') {
    return [];
  }
  return Object.keys(rolesClaim as Record<string, unknown>);
}

// Mirror of the signIn callback gating logic
function checkSignInAccess(profile: Record<string, unknown>): boolean {
  const roles = extractRoles(profile);
  if (!roles.includes('admin') && !roles.includes('app:app-portal')) {
    return false;
  }
  return true;
}

describe('signIn gate — Zitadel role check', () => {
  it('allows users with admin role', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: { admin: { '12345': 'org' } },
      })
    ).toBe(true);
  });

  it('allows users with app:app-portal role', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: { 'app:app-portal': { '12345': 'org' } },
      })
    ).toBe(true);
  });

  it('allows users with both admin and app-portal roles', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: {
          admin: { '12345': 'org' },
          'app:app-portal': { '12345': 'org' },
        },
      })
    ).toBe(true);
  });

  it('denies users with wrong app role', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: { 'app:proposal-rodeo': { '12345': 'org' } },
      })
    ).toBe(false);
  });

  it('denies users with empty roles object', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: {},
      })
    ).toBe(false);
  });

  it('denies users with no roles claim', () => {
    expect(checkSignInAccess({})).toBe(false);
  });

  it('denies users with non-object roles claim', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: 'not-an-object',
      })
    ).toBe(false);
  });

  it('denies users with other app roles only', () => {
    expect(
      checkSignInAccess({
        [ZITADEL_ROLES_CLAIM_GENERIC]: {
          'app:renewal-timesheets': { '12345': 'org' },
          'app:proposal-rodeo': { '12345': 'org' },
        },
      })
    ).toBe(false);
  });
});
