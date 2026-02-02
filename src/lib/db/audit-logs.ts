import { db } from '@/lib/db';
import { auditLogs, apps } from '@/lib/db/schema';
import { desc, eq, and, gte, lte, sql, count } from 'drizzle-orm';

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

/**
 * Audit action types
 */
export const AUDIT_ACTIONS = {
  APP_ACCESS: 'app_access',
  APP_CREATED: 'app_created',
  APP_UPDATED: 'app_updated',
  APP_DELETED: 'app_deleted',
  USER_INVITED: 'user_invited',
  USER_DEACTIVATED: 'user_deactivated',
  USER_REACTIVATED: 'user_reactivated',
  PERMISSIONS_UPDATED: 'permissions_updated',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Audit log with joined app data
 */
export type AuditLogWithApp = AuditLog & {
  appName: string | null;
  appSlug: string | null;
};

/**
 * Filter options for querying audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  appId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  userId: string,
  userEmail: string,
  action: AuditAction,
  appId?: string | null
): Promise<AuditLog> {
  const results = await db
    .insert(auditLogs)
    .values({
      userId,
      userEmail,
      action,
      appId: appId ?? null,
      createdAt: new Date(),
    })
    .returning();

  return results[0];
}

/**
 * Get audit logs with optional filtering and pagination
 */
export async function getAuditLogs(
  filters?: AuditLogFilters,
  pagination?: PaginationOptions
): Promise<{ logs: AuditLogWithApp[]; total: number }> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters?.appId) {
    conditions.push(eq(auditLogs.appId, filters.appId));
  }

  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get logs with app join
  const logs = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
      appId: auditLogs.appId,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      appName: apps.name,
      appSlug: apps.slug,
    })
    .from(auditLogs)
    .leftJoin(apps, eq(auditLogs.appId, apps.id))
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(whereClause);

  return {
    logs,
    total: countResult[0]?.count ?? 0,
  };
}

/**
 * Get recent audit logs for dashboard display
 */
export async function getRecentAuditLogs(
  limit: number = 5
): Promise<AuditLogWithApp[]> {
  return db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
      appId: auditLogs.appId,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      appName: apps.name,
      appSlug: apps.slug,
    })
    .from(auditLogs)
    .leftJoin(apps, eq(auditLogs.appId, apps.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get total count of audit log entries
 */
export async function getAuditLogCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(auditLogs);
  return result[0]?.count ?? 0;
}

/**
 * Delete audit logs older than specified number of days
 * Used for retention policy cleanup
 */
export async function deleteOldAuditLogs(daysOld: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db
    .delete(auditLogs)
    .where(lte(auditLogs.createdAt, cutoffDate))
    .returning();

  return result.length;
}

/**
 * Get distinct users who have audit log entries (for filter dropdown)
 */
export async function getAuditLogUsers(): Promise<
  { userId: string; userEmail: string }[]
> {
  const result = await db
    .selectDistinct({
      userId: auditLogs.userId,
      userEmail: auditLogs.userEmail,
    })
    .from(auditLogs)
    .orderBy(auditLogs.userEmail);

  return result;
}
