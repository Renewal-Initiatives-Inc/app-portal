'use server';

import { auth } from '@/lib/auth';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/db/audit-logs';

/**
 * Log when a user accesses an app from the portal
 * Called when user clicks on an app card
 */
export async function logAppAccessAction(appId: string): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    // User not authenticated, don't log
    return;
  }

  try {
    await logAuditEvent(
      session.user.id,
      session.user.email || 'unknown',
      AUDIT_ACTIONS.APP_ACCESS,
      appId
    );
  } catch (error) {
    // Don't block app access if logging fails
    console.error('Failed to log app access:', error);
  }
}
