import { deleteOldAuditLogs } from './audit-logs';
import { deleteOldNotifications } from './notifications';

/**
 * Retention periods (in days)
 */
const AUDIT_LOG_RETENTION_DAYS = 90;
const NOTIFICATION_RETENTION_DAYS = 30;

/**
 * Run cleanup of old records based on retention policies
 * - Audit logs: 90 days (per R7 requirements)
 * - Notifications: 30 days
 *
 * @returns Summary of deleted records
 */
export async function cleanupOldRecords(): Promise<{
  auditLogsDeleted: number;
  notificationsDeleted: number;
}> {
  const [auditLogsDeleted, notificationsDeleted] = await Promise.all([
    deleteOldAuditLogs(AUDIT_LOG_RETENTION_DAYS),
    deleteOldNotifications(NOTIFICATION_RETENTION_DAYS),
  ]);

  return {
    auditLogsDeleted,
    notificationsDeleted,
  };
}
