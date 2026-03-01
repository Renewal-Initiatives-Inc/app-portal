'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  createUser,
  deactivateUser,
  reactivateUser,
  getUserById,
  getAdminCount,
  getAdminUserIds,
  setUserPermissions,
  grantAdminRole,
  revokeAdminRole,
  isZitadelManagementConfigured,
} from '@/lib/zitadel';
import { db } from '@/lib/db';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/db/audit-logs';
import { createNotificationsForAdmins } from '@/lib/db/notifications';
import { checkActionRateLimit } from '@/lib/rate-limit';

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  appPermissions: z.array(z.string()).default([]),
  isAdmin: z.boolean().default(false),
});

const updatePermissionsSchema = z.object({
  appPermissions: z.array(z.string()),
  isAdmin: z.boolean(),
});

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  userId?: string;
};

async function verifyAdminAccess(): Promise<{
  authorized: boolean;
  error?: string;
  userId?: string;
  userEmail?: string;
}> {
  const session = await auth();

  if (!session) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const userRoles = session.user.roles || [];
  if (!isAdmin(userRoles)) {
    return { authorized: false, error: 'Admin access required' };
  }

  return {
    authorized: true,
    userId: session.user.id,
    userEmail: session.user.email || 'unknown',
  };
}

function verifyZitadelConfigured(): ActionResult | null {
  if (!isZitadelManagementConfigured()) {
    return {
      success: false,
      error: 'Zitadel Management API is not configured. Please set the required environment variables.',
    };
  }
  return null;
}

/**
 * Invite a new user
 */
export async function inviteUserAction(formData: FormData): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  const rawData = {
    email: formData.get('email') as string,
    firstName: (formData.get('firstName') as string) || '',
    lastName: (formData.get('lastName') as string) || '',
    appPermissions: formData.getAll('appPermissions') as string[],
    isAdmin: formData.get('isAdmin') === 'true',
  };

  // Validate input
  const result = inviteUserSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    // Create user in Zitadel
    const userId = await createUser(
      result.data.email,
      result.data.firstName || undefined,
      result.data.lastName || undefined
    );

    // Set permissions if any
    if (result.data.appPermissions.length > 0 || result.data.isAdmin) {
      await setUserPermissions(
        userId,
        result.data.appPermissions,
        result.data.isAdmin
      );
    }

    // Log audit event + notifications in a single transaction
    await db.transaction(async (tx) => {
      await logAuditEvent(
        accessCheck.userId!,
        accessCheck.userEmail!,
        AUDIT_ACTIONS.USER_INVITED,
        null,
        {
          tx,
          afterState: {
            email: result.data.email,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            appPermissions: result.data.appPermissions,
            isAdmin: result.data.isAdmin,
          },
        }
      );

      try {
        const adminIds = await getAdminUserIds();
        const otherAdminIds = adminIds.filter((id) => id !== accessCheck.userId);
        if (otherAdminIds.length > 0) {
          await createNotificationsForAdmins(
            otherAdminIds,
            `New user invited: ${result.data.email}`
          );
        }
      } catch (notifyError) {
        // Don't fail the action if notification fails
        console.error('Failed to create notifications:', notifyError);
      }
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { success: true, userId };
  } catch (error) {
    console.error('Failed to invite user:', error);
    const message = error instanceof Error ? error.message : 'Failed to invite user';
    return { success: false, error: message };
  }
}

/**
 * Update user permissions
 */
export async function updateUserPermissionsAction(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const rawData = {
    appPermissions: formData.getAll('appPermissions') as string[],
    isAdmin: formData.get('isAdmin') === 'true',
  };

  // Validate input
  const result = updatePermissionsSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  // Check self-demotion
  if (user.isAdmin && !result.data.isAdmin && userId === accessCheck.userId) {
    return {
      success: false,
      error: 'You cannot remove your own admin role',
    };
  }

  // Check minimum admin count
  if (user.isAdmin && !result.data.isAdmin) {
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'At least one admin must remain in the system',
      };
    }
  }

  try {
    await setUserPermissions(userId, result.data.appPermissions, result.data.isAdmin);

    // Log audit event + notifications in a single transaction
    await db.transaction(async (tx) => {
      await logAuditEvent(
        accessCheck.userId!,
        accessCheck.userEmail!,
        AUDIT_ACTIONS.PERMISSIONS_UPDATED,
        null,
        {
          tx,
          beforeState: {
            email: user.email,
            roles: user.roles,
            isAdmin: user.isAdmin,
          },
          afterState: {
            email: user.email,
            appPermissions: result.data.appPermissions,
            isAdmin: result.data.isAdmin,
          },
        }
      );

      try {
        const adminIds = await getAdminUserIds();
        const otherAdminIds = adminIds.filter((id) => id !== accessCheck.userId);
        if (otherAdminIds.length > 0) {
          await createNotificationsForAdmins(
            otherAdminIds,
            `Permissions updated for ${user.email}`
          );
        }
      } catch (notifyError) {
        // Don't fail the action if notification fails
        console.error('Failed to create notifications:', notifyError);
      }
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Failed to update user permissions:', error);
    const message = error instanceof Error ? error.message : 'Failed to update permissions';
    return { success: false, error: message };
  }
}

/**
 * Deactivate a user
 */
export async function deactivateUserAction(userId: string): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  // Prevent self-deactivation
  if (userId === accessCheck.userId) {
    return { success: false, error: 'You cannot deactivate your own account' };
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Check if deactivating the last admin
  if (user.isAdmin) {
    const adminCount = await getAdminCount();
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'Cannot deactivate the last admin in the system',
      };
    }
  }

  try {
    await deactivateUser(userId);

    await logAuditEvent(
      accessCheck.userId!,
      accessCheck.userEmail!,
      AUDIT_ACTIONS.USER_DEACTIVATED,
      null,
      {
        beforeState: { email: user.email, isActive: true },
        afterState: { email: user.email, isActive: false },
      }
    );

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    const message = error instanceof Error ? error.message : 'Failed to deactivate user';
    return { success: false, error: message };
  }
}

/**
 * Reactivate a user
 */
export async function reactivateUserAction(userId: string): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  try {
    await reactivateUser(userId);

    await logAuditEvent(
      accessCheck.userId!,
      accessCheck.userEmail!,
      AUDIT_ACTIONS.USER_REACTIVATED,
      null,
      {
        beforeState: { email: user.email, isActive: false },
        afterState: { email: user.email, isActive: true },
      }
    );

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Failed to reactivate user:', error);
    const message = error instanceof Error ? error.message : 'Failed to reactivate user';
    return { success: false, error: message };
  }
}

/**
 * Grant admin role to a user
 */
export async function grantAdminRoleAction(userId: string): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.isAdmin) {
    return { success: false, error: 'User is already an admin' };
  }

  try {
    await grantAdminRole(userId);

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Failed to grant admin role:', error);
    const message = error instanceof Error ? error.message : 'Failed to grant admin role';
    return { success: false, error: message };
  }
}

/**
 * Revoke admin role from a user
 */
export async function revokeAdminRoleAction(userId: string): Promise<ActionResult> {
  const configError = verifyZitadelConfigured();
  if (configError) return configError;

  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  // Prevent self-demotion
  if (userId === accessCheck.userId) {
    return { success: false, error: 'You cannot remove your own admin role' };
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.isAdmin) {
    return { success: false, error: 'User is not an admin' };
  }

  // Check minimum admin count
  const adminCount = await getAdminCount();
  if (adminCount <= 1) {
    return {
      success: false,
      error: 'At least one admin must remain in the system',
    };
  }

  try {
    await revokeAdminRole(userId);

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke admin role:', error);
    const message = error instanceof Error ? error.message : 'Failed to revoke admin role';
    return { success: false, error: message };
  }
}
