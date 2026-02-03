'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { updateUserPermissionsAction } from '@/app/admin/users/actions';
import type { App } from '@/lib/db/apps';
import type { PortalUser } from '@/lib/zitadel';

interface UserPermissionsFormProps {
  user: PortalUser;
  apps: App[];
  isCurrentUser: boolean;
  initialAction?: string;
}

export function UserPermissionsForm({
  user,
  apps,
  isCurrentUser,
  initialAction,
}: UserPermissionsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Extract current app permissions from roles (format: app:{slug})
  const currentAppSlugs = user.roles
    .filter((role) => role.startsWith('app:'))
    .map((role) => role.replace('app:', ''));

  // Form state
  const [selectedApps, setSelectedApps] = useState<string[]>(currentAppSlugs);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);

  // Track changes
  useEffect(() => {
    const appsChanged =
      selectedApps.length !== currentAppSlugs.length ||
      selectedApps.some((slug) => !currentAppSlugs.includes(slug));
    const adminChanged = isAdmin !== user.isAdmin;

    setHasChanges(appsChanged || adminChanged);
  }, [selectedApps, isAdmin, currentAppSlugs, user.isAdmin]);

  const handleAppToggle = (slug: string) => {
    setSelectedApps((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  const handleAdminToggle = (checked: boolean) => {
    setIsAdmin(checked);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('isAdmin', isAdmin.toString());
    selectedApps.forEach((slug) => {
      formData.append('appPermissions', slug);
    });

    try {
      const result = await updateUserPermissionsAction(user.id, formData);

      if (result.success) {
        toast.success('Permissions updated', {
          description: `${user.displayName || user.email}'s permissions have been updated.`,
        });
        router.refresh();
      } else {
        toast.error('Failed to update permissions', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (error) {
      toast.error('Failed to update permissions', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedApps(currentAppSlugs);
    setIsAdmin(user.isAdmin);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="user-permissions-form">
      {/* Admin Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Access
          </CardTitle>
          <CardDescription>
            Admins have full access to manage users, apps, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCurrentUser && user.isAdmin ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cannot modify your own admin role</AlertTitle>
              <AlertDescription>
                For security reasons, you cannot remove your own admin privileges.
                Another admin must do this.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="admin-toggle" className="text-base">
                  Administrator
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isAdmin
                    ? 'This user has full administrative access'
                    : 'Grant full administrative access'}
                </p>
              </div>
              <Switch
                id="admin-toggle"
                checked={isAdmin}
                onCheckedChange={handleAdminToggle}
                disabled={isSubmitting || (isCurrentUser && user.isAdmin)}
                data-testid="switch-admin"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App Permissions</CardTitle>
          <CardDescription>
            Select which applications this user can access.
            {isAdmin && (
              <span className="block mt-1 text-primary">
                Admins automatically have access to all apps.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No apps registered yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {apps.map((app) => {
                const isSelected = selectedApps.includes(app.slug);
                const isDisabled = isSubmitting || isAdmin;

                return (
                  <div
                    key={app.id}
                    className={`flex items-start space-x-3 rounded-md border p-3 ${
                      isSelected || isAdmin
                        ? 'border-primary/50 bg-primary/5'
                        : ''
                    }`}
                  >
                    <Checkbox
                      id={`app-${app.slug}`}
                      checked={isAdmin || isSelected}
                      onCheckedChange={() => handleAppToggle(app.slug)}
                      disabled={isDisabled}
                      data-testid={`checkbox-app-${app.slug}`}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`app-${app.slug}`}
                        className="text-sm font-medium leading-none"
                      >
                        {app.name}
                      </Label>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting || !hasChanges}
          className="w-full sm:w-auto"
          data-testid="user-permissions-form-reset-btn"
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          data-testid="submit-permissions"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {hasChanges && (
        <p className="text-sm text-muted-foreground text-center">
          You have unsaved changes.
        </p>
      )}
    </form>
  );
}
