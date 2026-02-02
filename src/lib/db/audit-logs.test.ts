import { describe, it, expect } from 'vitest';
import { AUDIT_ACTIONS } from './audit-logs';

describe('AUDIT_ACTIONS', () => {
  it('defines all expected action types', () => {
    expect(AUDIT_ACTIONS.APP_ACCESS).toBe('app_access');
    expect(AUDIT_ACTIONS.APP_CREATED).toBe('app_created');
    expect(AUDIT_ACTIONS.APP_UPDATED).toBe('app_updated');
    expect(AUDIT_ACTIONS.APP_DELETED).toBe('app_deleted');
    expect(AUDIT_ACTIONS.USER_INVITED).toBe('user_invited');
    expect(AUDIT_ACTIONS.USER_DEACTIVATED).toBe('user_deactivated');
    expect(AUDIT_ACTIONS.USER_REACTIVATED).toBe('user_reactivated');
    expect(AUDIT_ACTIONS.PERMISSIONS_UPDATED).toBe('permissions_updated');
  });

  it('contains 8 action types', () => {
    const actionCount = Object.keys(AUDIT_ACTIONS).length;
    expect(actionCount).toBe(8);
  });

  it('has unique values for all actions', () => {
    const values = Object.values(AUDIT_ACTIONS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});
