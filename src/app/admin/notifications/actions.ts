'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { markAsRead, markAllAsRead } from '@/lib/db/notifications';

export type ActionResult = {
  success: boolean;
  error?: string;
};

async function verifyAdminAccess(): Promise<{
  authorized: boolean;
  error?: string;
  userId?: string;
}> {
  const session = await auth();

  if (!session) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const userRoles = session.user.roles || [];
  if (!isAdmin(userRoles)) {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true, userId: session.user.id };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  try {
    await markAsRead(notificationId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read for the current admin
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  try {
    await markAllAsRead(accessCheck.userId!);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}
