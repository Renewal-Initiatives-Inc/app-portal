import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogTable } from './audit-log-table';
import type { AuditLogWithApp } from '@/lib/db/audit-logs';

const mockLogs: AuditLogWithApp[] = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'jeff@example.com',
    appId: 'app-1',
    action: 'app_access',
    beforeState: null,
    afterState: null,
    createdAt: new Date('2026-02-01T10:30:00Z'),
    appName: 'Timesheets',
    appSlug: 'timesheets',
  },
  {
    id: '2',
    userId: 'user-1',
    userEmail: 'jeff@example.com',
    appId: null,
    action: 'user_invited',
    beforeState: null,
    afterState: { email: 'new@example.com' },
    createdAt: new Date('2026-02-01T09:00:00Z'),
    appName: null,
    appSlug: null,
  },
];

describe('AuditLogTable', () => {
  it('renders empty state when no logs', () => {
    render(<AuditLogTable logs={[]} />);
    expect(screen.getByTestId('audit-log-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No audit events')).toBeInTheDocument();
  });

  it('renders table when logs exist', () => {
    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getByTestId('audit-log-table')).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getAllByText('jeff@example.com')).toHaveLength(2);
  });

  it('displays action badges', () => {
    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getByText('App Access')).toBeInTheDocument();
    expect(screen.getByText('User Invited')).toBeInTheDocument();
  });

  it('displays app name when present', () => {
    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getByText('Timesheets')).toBeInTheDocument();
  });

  it('displays dash when no app', () => {
    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders user initials in avatar', () => {
    render(<AuditLogTable logs={mockLogs} />);
    // "jeff" -> "JE" (first two chars of first part before @)
    expect(screen.getAllByText('JE')).toHaveLength(2);
  });
});
