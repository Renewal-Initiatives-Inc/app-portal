/**
 * Zitadel Management API Module
 *
 * Provides functions for managing users and roles in Zitadel.
 * Requires service account configuration via environment variables.
 *
 * Required Environment Variables:
 * - ZITADEL_ISSUER: Zitadel instance URL (already set for OIDC)
 * - ZITADEL_SERVICE_ACCOUNT_USER_ID: Service account user ID
 * - ZITADEL_SERVICE_ACCOUNT_KEY_ID: Service account key ID
 * - ZITADEL_SERVICE_ACCOUNT_PRIVATE_KEY: Base64-encoded private key
 * - ZITADEL_PROJECT_ID: Project ID for role assignments
 * - ZITADEL_ORG_ID: Organization ID for user management
 */

// Client utilities
export {
  isZitadelManagementConfigured,
  getProjectId,
  getOrgId,
  clearTokenCache,
} from './client';

// User operations
export {
  listUsers,
  getUserById,
  createUser,
  deactivateUser,
  reactivateUser,
  getUserCount,
  getAdminCount,
  getAdminUserIds,
} from './users';

// Role operations
export {
  getUserGrants,
  getAdminRole,
  getAppRoleGrants,
  createUserGrant,
  updateUserGrant,
  deleteUserGrant,
  grantAdminRole,
  revokeAdminRole,
  grantAppAccess,
  revokeAppAccess,
  setUserPermissions,
  getProjectRoles,
} from './roles';

// Types
export type {
  PortalUser,
  InviteUserInput,
  UpdateUserPermissionsInput,
  UserGrant,
  ZitadelUser,
  ZitadelUserDetails,
} from './types';
