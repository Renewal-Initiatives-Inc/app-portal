'use client';

import { useState, useTransition } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/admin/notifications/actions';
import type { Notification } from '@/lib/db/notifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Format relative time for display
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function NotificationDropdown({
  notifications,
  unreadCount,
}: NotificationDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setLocalUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      const result = await markNotificationReadAction(notificationId);
      if (!result.success) {
        // Revert on error
        setLocalNotifications(notifications);
        setLocalUnreadCount(unreadCount);
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLocalUnreadCount(0);

    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) {
        // Revert on error
        setLocalNotifications(notifications);
        setLocalUnreadCount(unreadCount);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="notification-trigger"
        >
          <Bell className="h-5 w-5" />
          {localUnreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground"
              data-testid="notification-badge"
            >
              {localUnreadCount > 9 ? '9+' : localUnreadCount}
            </span>
          )}
          <span className="sr-only">
            {localUnreadCount > 0
              ? `${localUnreadCount} unread notifications`
              : 'Notifications'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="notification-content">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {localUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="h-auto p-1 text-xs font-normal text-muted-foreground hover:text-foreground"
              data-testid="mark-all-read-button"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {localNotifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {localNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 py-3 cursor-default focus:bg-transparent"
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-medium'}`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    disabled={isPending}
                    data-testid={`mark-read-${notification.id}`}
                  >
                    <Check className="h-3 w-3" />
                    <span className="sr-only">Mark as read</span>
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
