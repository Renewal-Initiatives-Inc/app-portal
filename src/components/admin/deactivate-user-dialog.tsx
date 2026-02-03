'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deactivateUserAction } from '@/app/admin/users/actions';
import type { PortalUser } from '@/lib/zitadel';

interface DeactivateUserDialogProps {
  user: PortalUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
}: DeactivateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDeactivate = async () => {
    setIsLoading(true);

    try {
      const result = await deactivateUserAction(user.id);

      if (result.success) {
        toast.success('User deactivated', {
          description: `${user.displayName || user.email} has been deactivated.`,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error('Failed to deactivate user', {
          description: result.error || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      toast.error('Failed to deactivate user', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="deactivate-user-dialog">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Deactivate User</DialogTitle>
              <DialogDescription className="mt-1">
                This action can be reversed later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate{' '}
            <span className="font-medium text-foreground">
              {user.displayName || user.email}
            </span>
            ?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            The user will no longer be able to log in or access any applications.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            data-testid="deactivate-user-dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isLoading}
            data-testid="confirm-deactivate-user"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
