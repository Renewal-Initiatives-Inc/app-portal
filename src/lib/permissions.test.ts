import { describe, it, expect } from 'vitest';
import { hasAppAccess, filterAuthorizedApps, isAdmin } from './permissions';

describe('hasAppAccess', () => {
  it('grants access to admin for any app', () => {
    expect(hasAppAccess(['admin'], 'timesheets')).toBe(true);
    expect(hasAppAccess(['admin'], 'proposal-rodeo')).toBe(true);
    expect(hasAppAccess(['admin'], 'any-app')).toBe(true);
  });

  it('grants access when user has specific app role', () => {
    expect(hasAppAccess(['app:timesheets'], 'timesheets')).toBe(true);
    expect(hasAppAccess(['app:proposal-rodeo'], 'proposal-rodeo')).toBe(true);
  });

  it('denies access when user lacks app role', () => {
    expect(hasAppAccess(['app:timesheets'], 'proposal-rodeo')).toBe(false);
    expect(hasAppAccess(['app:other'], 'timesheets')).toBe(false);
  });

  it('denies access with empty roles', () => {
    expect(hasAppAccess([], 'timesheets')).toBe(false);
  });

  it('handles multiple roles correctly', () => {
    const roles = ['app:timesheets', 'app:proposal-rodeo'];
    expect(hasAppAccess(roles, 'timesheets')).toBe(true);
    expect(hasAppAccess(roles, 'proposal-rodeo')).toBe(true);
    expect(hasAppAccess(roles, 'other-app')).toBe(false);
  });
});

describe('filterAuthorizedApps', () => {
  const sampleApps = [
    { slug: 'timesheets', name: 'Timesheets' },
    { slug: 'proposal-rodeo', name: 'Proposal Rodeo' },
    { slug: 'calendar', name: 'Calendar' },
  ];

  it('returns all apps for admin', () => {
    const result = filterAuthorizedApps(sampleApps, ['admin']);
    expect(result).toHaveLength(3);
    expect(result).toEqual(sampleApps);
  });

  it('filters to only authorized apps', () => {
    const result = filterAuthorizedApps(sampleApps, ['app:timesheets']);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('timesheets');
  });

  it('returns multiple apps when user has multiple roles', () => {
    const result = filterAuthorizedApps(sampleApps, [
      'app:timesheets',
      'app:calendar',
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.slug)).toEqual(['timesheets', 'calendar']);
  });

  it('returns empty array when user has no matching roles', () => {
    const result = filterAuthorizedApps(sampleApps, ['app:other']);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty roles', () => {
    const result = filterAuthorizedApps(sampleApps, []);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty apps list', () => {
    const result = filterAuthorizedApps([], ['admin']);
    expect(result).toHaveLength(0);
  });
});

describe('isAdmin', () => {
  it('returns true when user has admin role', () => {
    expect(isAdmin(['admin'])).toBe(true);
    expect(isAdmin(['admin', 'app:timesheets'])).toBe(true);
  });

  it('returns false when user lacks admin role', () => {
    expect(isAdmin(['app:timesheets'])).toBe(false);
    expect(isAdmin([])).toBe(false);
  });
});
