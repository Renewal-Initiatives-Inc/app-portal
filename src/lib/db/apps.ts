import { db } from '@/lib/db';
import { apps } from '@/lib/db/schema';
import { filterAuthorizedApps } from '@/lib/permissions';
import { asc } from 'drizzle-orm';

export type App = typeof apps.$inferSelect;

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
