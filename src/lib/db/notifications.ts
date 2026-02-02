import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { desc, eq, and, lte, count } from 'drizzle-orm';

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

/**
 * Create a notification for an admin
 */
export async function createNotification(
  adminId: string,
  message: string
): Promise<Notification> {
  const results = await db
    .insert(notifications)
    .values({
      adminId,
      message,
      read: false,
      createdAt: new Date(),
    })
    .returning();

  return results[0];
}

/**
 * Create notifications for multiple admins
 * Useful when notifying all admins about an event
 */
export async function createNotificationsForAdmins(
  adminIds: string[],
  message: string
): Promise<Notification[]> {
  if (adminIds.length === 0) return [];

  const results = await db
    .insert(notifications)
    .values(
      adminIds.map((adminId) => ({
        adminId,
        message,
        read: false,
        createdAt: new Date(),
      }))
    )
    .returning();

  return results;
}

/**
 * Get notifications for an admin
 */
export async function getNotifications(
  adminId: string,
  limit: number = 10
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.adminId, adminId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Get unread notification count for an admin
 */
export async function getUnreadCount(adminId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.adminId, adminId),
        eq(notifications.read, false)
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
    .returning();

  return result.length > 0;
}

/**
 * Mark all notifications as read for an admin
 */
export async function markAllAsRead(adminId: string): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.adminId, adminId),
        eq(notifications.read, false)
      )
    )
    .returning();

  return result.length;
}

/**
 * Delete notifications older than specified number of days
 * Used for retention policy cleanup
 */
export async function deleteOldNotifications(daysOld: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(notifications)
    .where(lte(notifications.createdAt, cutoffDate))
    .returning();

  return result.length;
}
