import { db } from '@/lib/db';
import { apps, auditLogs } from '@/lib/db/schema';
import { filterAuthorizedApps } from '@/lib/permissions';
import { asc, eq, ne, and } from 'drizzle-orm';
import type { DbTransaction } from '@/lib/db/audit-logs';

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;

/**
 * Get all apps from database, sorted by name
 */
export async function getAllApps(): Promise<App[]> {
  return db.select().from(apps).orderBy(asc(apps.name));
}

/**
 * Get apps authorized for a user based on their roles
 * Fetches all apps and filters by permission
 */
export async function getAuthorizedApps(userRoles: string[]): Promise<App[]> {
  const allApps = await getAllApps();
  return filterAuthorizedApps(allApps, userRoles);
}

/**
 * Get a single app by ID
 */
export async function getAppById(id: string): Promise<App | null> {
  const results = await db.select().from(apps).where(eq(apps.id, id)).limit(1);
  return results[0] ?? null;
}

/**
 * Get a single app by slug
 */
export async function getAppBySlug(slug: string): Promise<App | null> {
  const results = await db
    .select()
    .from(apps)
    .where(eq(apps.slug, slug))
    .limit(1);
  return results[0] ?? null;
}

/**
 * Check if a slug is unique (optionally excluding a specific app ID)
 */
export async function isSlugUnique(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query = excludeId
    ? db
        .select()
        .from(apps)
        .where(and(eq(apps.slug, slug), ne(apps.id, excludeId)))
    : db.select().from(apps).where(eq(apps.slug, slug));

  const results = await query.limit(1);
  return results.length === 0;
}

/**
 * Create a new app. Accepts optional transaction context.
 */
export async function createApp(
  data: Omit<NewApp, 'id' | 'createdAt' | 'updatedAt'>,
  tx?: DbTransaction
): Promise<App> {
  const executor = tx ?? db;
  const results = await executor
    .insert(apps)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return results[0];
}

/**
 * Update an existing app. Accepts optional transaction context.
 */
export async function updateApp(
  id: string,
  data: Partial<Omit<NewApp, 'id' | 'createdAt'>>,
  tx?: DbTransaction
): Promise<App | null> {
  const executor = tx ?? db;
  const results = await executor
    .update(apps)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(apps.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Delete an app by ID. Accepts optional transaction context.
 * First nullifies any audit log references to avoid foreign key constraint violations.
 */
export async function deleteApp(id: string, tx?: DbTransaction): Promise<boolean> {
  const executor = tx ?? db;
  // First, nullify appId references in audit_logs to avoid FK constraint
  await executor
    .update(auditLogs)
    .set({ appId: null })
    .where(eq(auditLogs.appId, id));

  // Now delete the app
  const results = await executor.delete(apps).where(eq(apps.id, id)).returning();
  return results.length > 0;
}
