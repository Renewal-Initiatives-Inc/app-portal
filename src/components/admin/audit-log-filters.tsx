'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AUDIT_ACTIONS } from '@/lib/db/audit-logs';
import type { App } from '@/lib/db/apps';

interface AuditLogFiltersProps {
  users: { userId: string; userEmail: string }[];
  apps: App[];
}

// Placeholder value for "all" selections (Radix Select doesn't support empty string values)
const ALL_VALUE = '__all__';

const ACTION_OPTIONS = [
  { value: AUDIT_ACTIONS.APP_ACCESS, label: 'App Access' },
  { value: AUDIT_ACTIONS.APP_CREATED, label: 'App Created' },
  { value: AUDIT_ACTIONS.APP_UPDATED, label: 'App Updated' },
  { value: AUDIT_ACTIONS.APP_DELETED, label: 'App Deleted' },
  { value: AUDIT_ACTIONS.USER_INVITED, label: 'User Invited' },
  { value: AUDIT_ACTIONS.USER_DEACTIVATED, label: 'User Deactivated' },
  { value: AUDIT_ACTIONS.USER_REACTIVATED, label: 'User Reactivated' },
  { value: AUDIT_ACTIONS.PERMISSIONS_UPDATED, label: 'Permissions Updated' },
  { value: AUDIT_ACTIONS.EMPLOYEE_CREATED, label: 'Employee Created' },
  { value: AUDIT_ACTIONS.EMPLOYEE_UPDATED, label: 'Employee Updated' },
  { value: AUDIT_ACTIONS.EMPLOYEE_DEACTIVATED, label: 'Employee Deactivated' },
  { value: AUDIT_ACTIONS.LOGIN_DENIED, label: 'Login Denied' },
];

export function AuditLogFilters({ users, apps }: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentAction = searchParams.get('action') || ALL_VALUE;
  const currentUser = searchParams.get('user') || ALL_VALUE;
  const currentApp = searchParams.get('app') || ALL_VALUE;
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';

  const hasFilters = searchParams.get('action') || searchParams.get('user') || searchParams.get('app') || currentStartDate || currentEndDate;

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset to page 1 when filters change
      params.delete('page');

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === ALL_VALUE) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`/admin/audit-log?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push('/admin/audit-log');
    });
  }, [router]);

  return (
    <div className="space-y-4" data-testid="audit-log-filters">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Action Filter */}
        <div className="space-y-2">
          <Label htmlFor="action-filter">Action</Label>
          <Select
            value={currentAction}
            onValueChange={(value) => updateFilters({ action: value })}
          >
            <SelectTrigger id="action-filter" data-testid="action-filter">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All actions</SelectItem>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <Label htmlFor="user-filter">User</Label>
          <Select
            value={currentUser}
            onValueChange={(value) => updateFilters({ user: value })}
          >
            <SelectTrigger id="user-filter" data-testid="user-filter">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.userId} value={user.userId}>
                  {user.userEmail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* App Filter */}
        <div className="space-y-2">
          <Label htmlFor="app-filter">App</Label>
          <Select
            value={currentApp}
            onValueChange={(value) => updateFilters({ app: value })}
          >
            <SelectTrigger id="app-filter" data-testid="app-filter">
              <SelectValue placeholder="All apps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All apps</SelectItem>
              {apps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="start-date-filter">From</Label>
          <Input
            id="start-date-filter"
            type="date"
            value={currentStartDate}
            onChange={(e) => updateFilters({ startDate: e.target.value || null })}
            data-testid="start-date-filter"
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="end-date-filter">To</Label>
          <Input
            id="end-date-filter"
            type="date"
            value={currentEndDate}
            onChange={(e) => updateFilters({ endDate: e.target.value || null })}
            data-testid="end-date-filter"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
            data-testid="clear-filters-button"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
