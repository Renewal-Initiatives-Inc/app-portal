'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  createApp,
  updateApp,
  deleteApp,
  isSlugUnique,
  getAppById,
} from '@/lib/db/apps';

// Validation schemas
const appSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must only contain lowercase letters, numbers, and hyphens'
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  appUrl: z.string().url('Must be a valid URL'),
  iconUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function verifyAdminAccess(): Promise<{
  authorized: boolean;
  error?: string;
}> {
  const session = await auth();

  if (!session) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const userRoles = session.user.roles || [];
  if (!isAdmin(userRoles)) {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true };
}

export async function createAppAction(formData: FormData): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    appUrl: formData.get('appUrl') as string,
    iconUrl: (formData.get('iconUrl') as string) || undefined,
  };

  // Validate input
  const result = appSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  // Check slug uniqueness
  const slugUnique = await isSlugUnique(result.data.slug);
  if (!slugUnique) {
    return {
      success: false,
      error: 'Slug already exists',
      fieldErrors: { slug: ['This slug is already in use'] },
    };
  }

  try {
    await createApp({
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
      appUrl: result.data.appUrl,
      iconUrl: result.data.iconUrl || null,
    });

    revalidatePath('/admin/apps');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to create app:', error);
    return { success: false, error: 'Failed to create app' };
  }
}

export async function updateAppAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  // Verify app exists
  const existingApp = await getAppById(id);
  if (!existingApp) {
    return { success: false, error: 'App not found' };
  }

  const rawData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    appUrl: formData.get('appUrl') as string,
    iconUrl: (formData.get('iconUrl') as string) || undefined,
  };

  // Validate input
  const result = appSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  // Check slug uniqueness (excluding current app)
  const slugUnique = await isSlugUnique(result.data.slug, id);
  if (!slugUnique) {
    return {
      success: false,
      error: 'Slug already exists',
      fieldErrors: { slug: ['This slug is already in use'] },
    };
  }

  try {
    await updateApp(id, {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
      appUrl: result.data.appUrl,
      iconUrl: result.data.iconUrl || null,
    });

    revalidatePath('/admin/apps');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to update app:', error);
    return { success: false, error: 'Failed to update app' };
  }
}

export async function deleteAppAction(id: string): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  // Verify app exists
  const existingApp = await getAppById(id);
  if (!existingApp) {
    return { success: false, error: 'App not found' };
  }

  try {
    const deleted = await deleteApp(id);
    if (!deleted) {
      return { success: false, error: 'Failed to delete app' };
    }

    revalidatePath('/admin/apps');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete app:', error);
    return { success: false, error: 'Failed to delete app' };
  }
}
