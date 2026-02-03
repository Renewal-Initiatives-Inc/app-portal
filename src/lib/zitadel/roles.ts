/**
 * Zitadel Role/Grant Management Functions
 * Handles user grants (role assignments) via the Zitadel Management API
 */

import { zitadelRequest, getProjectId, isZitadelManagementConfigured } from './client';
import type {
  ListUserGrantsResponse,
  UserGrant,
  CreateUserGrantResponse,
} from './types';

// Admin role key
const ADMIN_ROLE_KEY = 'admin';

/**
 * Get all grants for a user
 */
export async function getUserGrants(userId: string): Promise<UserGrant[]> {
  if (!isZitadelManagementConfigured()) {
    return [];
  }

  try {
    const projectId = getProjectId();

    // List user grants filtered by project
    const response = await zitadelRequest<ListUserGrantsResponse>(
      '/management/v1/users/grants/_search',
      {
        method: 'POST',
        body: JSON.stringify({
          query: {
            offset: '0',
            limit: 100,
          },
          queries: [
            {
              userIdQuery: {
                userId,
              },
            },
            {
              projectIdQuery: {
                projectId,
              },
            },
          ],
        }),
      }
    );

    return response.result || [];
  } catch (error) {
    console.error(`Failed to get grants for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get the admin role grant for a user (if any)
 */
export async function getAdminRole(userId: string): Promise<UserGrant | null> {
  const grants = await getUserGrants(userId);

  for (const grant of grants) {
    if (grant.roleKeys.includes(ADMIN_ROLE_KEY)) {
      return grant;
    }
  }

  return null;
}

/**
 * Get app role grants for a user
 */
export async function getAppRoleGrants(userId: string): Promise<UserGrant[]> {
  const grants = await getUserGrants(userId);

  return grants.filter(grant =>
    grant.roleKeys.some(role => role.startsWith('app:'))
  );
}

/**
 * Create a user grant (assign roles)
 */
export async function createUserGrant(
  userId: string,
  roleKeys: string[]
): Promise<string> {
  const projectId = getProjectId();

  const response = await zitadelRequest<CreateUserGrantResponse>(
    `/management/v1/users/${userId}/grants`,
    {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        roleKeys,
      }),
    }
  );

  return response.userGrantId;
}

/**
 * Update a user grant (modify roles)
 */
export async function updateUserGrant(
  userId: string,
  grantId: string,
  roleKeys: string[]
): Promise<void> {
  await zitadelRequest(
    `/management/v1/users/${userId}/grants/${grantId}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        roleKeys,
      }),
    }
  );
}

/**
 * Delete a user grant
 */
export async function deleteUserGrant(
  userId: string,
  grantId: string
): Promise<void> {
  await zitadelRequest(
    `/management/v1/users/${userId}/grants/${grantId}`,
    { method: 'DELETE' }
  );
}

/**
 * Grant admin role to a user
 */
export async function grantAdminRole(userId: string): Promise<void> {
  // Check if user already has any grants
  const existingGrants = await getUserGrants(userId);

  if (existingGrants.length > 0) {
    // User has existing grants - add admin to the first one
    const grant = existingGrants[0];
    if (!grant.roleKeys.includes(ADMIN_ROLE_KEY)) {
      await updateUserGrant(userId, grant.id, [...grant.roleKeys, ADMIN_ROLE_KEY]);
    }
  } else {
    // Create a new grant with admin role
    await createUserGrant(userId, [ADMIN_ROLE_KEY]);
  }
}

/**
 * Revoke admin role from a user
 */
export async function revokeAdminRole(userId: string): Promise<void> {
  const grants = await getUserGrants(userId);

  for (const grant of grants) {
    if (grant.roleKeys.includes(ADMIN_ROLE_KEY)) {
      const newRoleKeys = grant.roleKeys.filter(role => role !== ADMIN_ROLE_KEY);

      if (newRoleKeys.length > 0) {
        // Update the grant without admin role
        await updateUserGrant(userId, grant.id, newRoleKeys);
      } else {
        // No other roles, delete the grant
        await deleteUserGrant(userId, grant.id);
      }
    }
  }
}

/**
 * Grant app access to a user
 */
export async function grantAppAccess(userId: string, appSlug: string): Promise<void> {
  const roleKey = `app:${appSlug}`;

  // Validate that the role exists in Zitadel before granting
  const validation = await validateRolesExist([roleKey]);
  if (!validation.valid) {
    throw new Error(
      `Cannot grant access: role '${roleKey}' not found in Zitadel. ` +
      `Please create this role in the Zitadel Console first.`
    );
  }

  const existingGrants = await getUserGrants(userId);

  if (existingGrants.length > 0) {
    // Add to existing grant
    const grant = existingGrants[0];
    if (!grant.roleKeys.includes(roleKey)) {
      await updateUserGrant(userId, grant.id, [...grant.roleKeys, roleKey]);
    }
  } else {
    // Create new grant
    await createUserGrant(userId, [roleKey]);
  }
}

/**
 * Revoke app access from a user
 */
export async function revokeAppAccess(userId: string, appSlug: string): Promise<void> {
  const roleKey = `app:${appSlug}`;
  const grants = await getUserGrants(userId);

  for (const grant of grants) {
    if (grant.roleKeys.includes(roleKey)) {
      const newRoleKeys = grant.roleKeys.filter(role => role !== roleKey);

      if (newRoleKeys.length > 0) {
        await updateUserGrant(userId, grant.id, newRoleKeys);
      } else {
        await deleteUserGrant(userId, grant.id);
      }
    }
  }
}

/**
 * Set user permissions (replaces all app permissions)
 */
export async function setUserPermissions(
  userId: string,
  appSlugs: string[],
  isAdmin: boolean
): Promise<void> {
  // Build the new role keys
  const newRoleKeys = appSlugs.map(slug => `app:${slug}`);
  if (isAdmin) {
    newRoleKeys.push(ADMIN_ROLE_KEY);
  }

  // Validate that app roles exist in Zitadel before granting
  const appRoleKeys = newRoleKeys.filter(role => role.startsWith('app:'));
  if (appRoleKeys.length > 0) {
    const validation = await validateRolesExist(appRoleKeys);
    if (!validation.valid) {
      throw new Error(
        `Cannot grant access: roles not found in Zitadel: ${validation.missingRoles.join(', ')}. ` +
        `Please create these roles in the Zitadel Console first.`
      );
    }
  }

  const existingGrants = await getUserGrants(userId);

  if (existingGrants.length === 0 && newRoleKeys.length > 0) {
    // Create new grant
    await createUserGrant(userId, newRoleKeys);
  } else if (existingGrants.length > 0) {
    // Update first grant, delete others
    const [firstGrant, ...otherGrants] = existingGrants;

    if (newRoleKeys.length > 0) {
      await updateUserGrant(userId, firstGrant.id, newRoleKeys);
    } else {
      await deleteUserGrant(userId, firstGrant.id);
    }

    // Clean up any additional grants
    for (const grant of otherGrants) {
      await deleteUserGrant(userId, grant.id);
    }
  }
}

/**
 * Validate that the specified roles exist in Zitadel
 * Returns information about which roles are missing (if any)
 */
export async function validateRolesExist(roleKeys: string[]): Promise<{
  valid: boolean;
  missingRoles: string[];
}> {
  if (roleKeys.length === 0) {
    return { valid: true, missingRoles: [] };
  }

  const existingRoles = await getProjectRoles();
  const missingRoles = roleKeys.filter(role => !existingRoles.includes(role));

  return {
    valid: missingRoles.length === 0,
    missingRoles,
  };
}

/**
 * Get all available roles for the project
 */
export async function getProjectRoles(): Promise<string[]> {
  try {
    const projectId = getProjectId();

    const response = await zitadelRequest<{
      result: Array<{ key: string; displayName: string }>;
    }>(
      `/management/v1/projects/${projectId}/roles/_search`,
      {
        method: 'POST',
        body: JSON.stringify({
          query: {
            offset: '0',
            limit: 100,
          },
        }),
      }
    );

    return (response.result || []).map(role => role.key);
  } catch (error) {
    console.error('Failed to get project roles:', error);
    return [];
  }
}
