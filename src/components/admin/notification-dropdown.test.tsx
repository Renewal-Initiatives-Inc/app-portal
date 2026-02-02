import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationDropdown } from './notification-dropdown';
import type { Notification } from '@/lib/db/notifications';

// Mock the server actions
vi.mock('@/app/admin/notifications/actions', () => ({
  markNotificationReadAction: vi.fn().mockResolvedValue({ success: true }),
  markAllNotificationsReadAction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockNotifications: Notification[] = [
  {
    id: '1',
    adminId: 'admin-1',
    message: 'New user invited: test@example.com',
    read: false,
    createdAt: new Date('2026-02-01T10:00:00Z'),
  },
  {
    id: '2',
    adminId: 'admin-1',
    message: 'Permissions updated for user@example.com',
    read: true,
    createdAt: new Date('2026-02-01T09:00:00Z'),
  },
];

describe('NotificationDropdown', () => {
  it('renders bell icon trigger', () => {
    render(<NotificationDropdown notifications={[]} unreadCount={0} />);
    expect(screen.getByTestId('notification-trigger')).toBeInTheDocument();
  });

  it('shows badge with unread count', () => {
    render(<NotificationDropdown notifications={mockNotifications} unreadCount={1} />);
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('1');
  });

  it('hides badge when no unread', () => {
    render(<NotificationDropdown notifications={mockNotifications} unreadCount={0} />);
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
  });

  it('shows 9+ for many unread notifications', () => {
    render(<NotificationDropdown notifications={mockNotifications} unreadCount={15} />);
    expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+');
  });

  it('has accessible name for screen readers', () => {
    render(<NotificationDropdown notifications={mockNotifications} unreadCount={3} />);
    expect(screen.getByText('3 unread notifications')).toBeInTheDocument();
  });

  it('shows different sr-text when no unread', () => {
    render(<NotificationDropdown notifications={mockNotifications} unreadCount={0} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});
