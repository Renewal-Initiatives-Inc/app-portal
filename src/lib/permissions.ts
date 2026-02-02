/**
 * Permission utilities for app access control
 *
 * Permission model:
 * - Zitadel roles follow pattern: app:<slug> (e.g., app:timesheets)
 * - Role "admin" grants access to all apps
 * - Users only see apps they have explicit permission for
 */

/**
 * Check if user has access to a specific app
 */
export function hasAppAccess(userRoles: string[], appSlug: string): boolean {
  // Admin has access to all apps
  if (userRoles.includes('admin')) {
    return true;
  }
  // Check for specific app role
  return userRoles.includes(`app:${appSlug}`);
}

/**
 * Filter apps list to only those user can access
 */
export function filterAuthorizedApps<T extends { slug: string }>(
  apps: T[],
  userRoles: string[]
): T[] {
  return apps.filter((app) => hasAppAccess(userRoles, app.slug));
}

/**
 * Check if user has admin role
 */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.includes('admin');
}
