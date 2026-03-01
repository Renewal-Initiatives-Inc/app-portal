import { deleteOldNotifications } from './notifications';

/**
 * Retention periods (in days)
 */
const NOTIFICATION_RETENTION_DAYS = 30;

/**
 * Run cleanup of old records based on retention policies
 * - Notifications: 30 days
 *
 * Note: Audit logs are retained indefinitely per Information Security Policy §6.3
 *
 * @returns Summary of deleted records
 */
export async function cleanupOldRecords(): Promise<{
  notificationsDeleted: number;
}> {
  const notificationsDeleted = await deleteOldNotifications(NOTIFICATION_RETENTION_DAYS);

  return {
    notificationsDeleted,
  };
}
