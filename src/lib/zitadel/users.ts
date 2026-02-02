/**
 * Zitadel User Management Functions
 * Handles user CRUD operations via the Zitadel Management API v2
 */

import { zitadelRequest, isZitadelManagementConfigured } from './client';
import { getUserGrants, getAdminRole } from './roles';
import type {
  ListUsersResponse,
  CreateHumanUserRequest,
  CreateUserResponse,
  ZitadelUserDetails,
  PortalUser,
} from './types';

/**
 * Convert Zitadel user state to our simplified status
 */
function mapUserState(state: string): 'active' | 'inactive' | 'pending' {
  switch (state) {
    case 'USER_STATE_ACTIVE':
      return 'active';
    case 'USER_STATE_INACTIVE':
    case 'USER_STATE_LOCKED':
    case 'USER_STATE_DELETED':
      return 'inactive';
    case 'USER_STATE_INITIAL':
      return 'pending';
    default:
      return 'inactive';
  }
}

/**
 * Convert Zitadel user to our PortalUser format
 * Note: v2 API returns user fields directly on userDetails, not nested under 'user'
 */
function toPortalUser(
  userDetails: ZitadelUserDetails,
  grants: string[],
  isAdmin: boolean
): PortalUser {
  const human = userDetails.human;

  return {
    id: userDetails.userId,
    email: human?.email?.email || userDetails.preferredLoginName || '',
    firstName: human?.profile?.givenName || '',
    lastName: human?.profile?.familyName || '',
    displayName: human?.profile?.displayName ||
      `${human?.profile?.givenName || ''} ${human?.profile?.familyName || ''}`.trim() ||
      userDetails.preferredLoginName || '',
    avatarUrl: human?.profile?.avatarUrl,
    status: mapUserState(userDetails.state),
    roles: grants,
    isAdmin,
    createdAt: userDetails.details.creationDate,
  };
}

/**
 * List all users in the organization
 */
export async function listUsers(): Promise<PortalUser[]> {
  if (!isZitadelManagementConfigured()) {
    console.warn('Zitadel Management API not configured, returning empty user list');
    return [];
  }

  try {
    // Search for all human users
    const response = await zitadelRequest<ListUsersResponse>(
      '/v2/users',
      {
        method: 'POST',
        body: JSON.stringify({
          query: {
            offset: '0',
            limit: 100,
            asc: true,
          },
          queries: [
            {
              typeQuery: {
                type: 'TYPE_HUMAN',
              },
            },
          ],
        }),
      }
    );

    if (!response.result || response.result.length === 0) {
      return [];
    }

    // Filter out any malformed entries without a valid userId
    const validUsers = response.result.filter(
      (userDetails) => userDetails?.userId
    );

    // Get grants for all users in parallel
    const usersWithGrants = await Promise.all(
      validUsers.map(async (userDetails) => {
        try {
          const grants = await getUserGrants(userDetails.userId);
          const adminRole = await getAdminRole(userDetails.userId);
          const isAdmin = !!adminRole;

          // Extract app roles (format: app:{slug})
          const appRoles = grants
            .flatMap(g => g.roleKeys)
            .filter(role => role.startsWith('app:'));

          return toPortalUser(userDetails, appRoles, isAdmin);
        } catch (error) {
          console.error(`Failed to get grants for user ${userDetails.userId}:`, error);
          return toPortalUser(userDetails, [], false);
        }
      })
    );

    return usersWithGrants;
  } catch (error) {
    console.error('Failed to list users:', error);
    throw error;
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<PortalUser | null> {
  if (!isZitadelManagementConfigured()) {
    return null;
  }

  try {
    // Single user GET endpoint returns user nested under 'user' property
    // (different from list endpoint which returns flat structure)
    const response = await zitadelRequest<{ user: ZitadelUserDetails; details: ZitadelUserDetails['details'] }>(
      `/v2/users/${userId}`,
      { method: 'GET' }
    );

    if (!response.user?.userId) {
      return null;
    }

    const grants = await getUserGrants(userId);
    const adminRole = await getAdminRole(userId);
    const isAdmin = !!adminRole;

    const appRoles = grants
      .flatMap(g => g.roleKeys)
      .filter(role => role.startsWith('app:'));

    // Merge the outer details with the user object for toPortalUser
    const userDetails: ZitadelUserDetails = {
      ...response.user,
      details: response.user.details || response.details,
    };

    return toPortalUser(userDetails, appRoles, isAdmin);
  } catch (error) {
    console.error(`Failed to get user ${userId}:`, error);
    return null;
  }
}

/**
 * Create a new user (invite via email)
 * Zitadel will send an initialization email to the user
 */
export async function createUser(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<string> {
  const request: CreateHumanUserRequest = {
    profile: {
      givenName: firstName || email.split('@')[0],
      familyName: lastName || '',
    },
    email: {
      email,
      isVerified: false, // Will send verification email
    },
  };

  const response = await zitadelRequest<CreateUserResponse>(
    '/v2/users/human',
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  return response.userId;
}

/**
 * Deactivate a user
 */
export async function deactivateUser(userId: string): Promise<void> {
  await zitadelRequest(
    `/v2/users/${userId}/deactivate`,
    { method: 'POST' }
  );
}

/**
 * Reactivate a user
 */
export async function reactivateUser(userId: string): Promise<void> {
  await zitadelRequest(
    `/v2/users/${userId}/reactivate`,
    { method: 'POST' }
  );
}

/**
 * Get the total count of active users
 */
export async function getUserCount(): Promise<number> {
  if (!isZitadelManagementConfigured()) {
    return 0;
  }

  try {
    const response = await zitadelRequest<ListUsersResponse>(
      '/v2/users',
      {
        method: 'POST',
        body: JSON.stringify({
          query: {
            offset: '0',
            limit: 1,
          },
          queries: [
            {
              typeQuery: {
                type: 'TYPE_HUMAN',
              },
            },
            {
              stateQuery: {
                state: 'USER_STATE_ACTIVE',
              },
            },
          ],
        }),
      }
    );

    return parseInt(response.details?.totalResult || '0', 10);
  } catch (error) {
    console.error('Failed to get user count:', error);
    return 0;
  }
}

/**
 * Check if a user is the current authenticated user (for self-demotion prevention)
 */
export async function isCurrentUser(userId: string, currentUserId: string): Promise<boolean> {
  return userId === currentUserId;
}

/**
 * Count the number of admins in the system
 */
export async function getAdminCount(): Promise<number> {
  const users = await listUsers();
  return users.filter(u => u.isAdmin).length;
}

/**
 * Get all admin user IDs
 * Used for sending notifications to admins
 */
export async function getAdminUserIds(): Promise<string[]> {
  const users = await listUsers();
  return users.filter(u => u.isAdmin).map(u => u.id);
}
