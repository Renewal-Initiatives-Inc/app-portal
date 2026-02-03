'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { inviteUserAction } from '@/app/admin/users/actions';
import type { App } from '@/lib/db/apps';

interface UserInviteFormProps {
  apps: App[];
}

export function UserInviteForm({ apps }: UserInviteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAppToggle = (slug: string) => {
    setSelectedApps((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('email', email);
    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('isAdmin', isAdmin.toString());
    selectedApps.forEach((slug) => {
      formData.append('appPermissions', slug);
    });

    try {
      const result = await inviteUserAction(formData);

      if (result.success) {
        toast.success('Invitation sent', {
          description: `An invitation email has been sent to ${email}.`,
        });
        router.push('/admin/users');
        router.refresh();
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error('Failed to send invitation', {
          description: result.error || 'Please check the form and try again.',
        });
      }
    } catch (error) {
      toast.error('Failed to send invitation', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="user-invite-form">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Details</CardTitle>
          <CardDescription>
            Enter the user&apos;s information. Only email is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              data-testid="input-email"
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
                data-testid="input-first-name"
              />
              {fieldErrors.firstName && (
                <p className="text-sm text-destructive">{fieldErrors.firstName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
                data-testid="input-last-name"
              />
              {fieldErrors.lastName && (
                <p className="text-sm text-destructive">{fieldErrors.lastName[0]}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Access</CardTitle>
          <CardDescription>
            Admins can manage all users, apps, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked === true)}
              disabled={isSubmitting}
              data-testid="checkbox-admin"
            />
            <Label
              htmlFor="isAdmin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Grant admin privileges
            </Label>
          </div>
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
              No apps registered yet. You can add permissions after the user is created.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-start space-x-3 rounded-md border p-3"
                >
                  <Checkbox
                    id={`app-${app.slug}`}
                    checked={isAdmin || selectedApps.includes(app.slug)}
                    onCheckedChange={() => handleAppToggle(app.slug)}
                    disabled={isSubmitting || isAdmin}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
          data-testid="user-invite-form-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-invite"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            'Send Invitation'
          )}
        </Button>
      </div>
    </form>
  );
}
