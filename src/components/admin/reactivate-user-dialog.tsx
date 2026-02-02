'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';
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
import { reactivateUserAction } from '@/app/admin/users/actions';
import type { PortalUser } from '@/lib/zitadel';

interface ReactivateUserDialogProps {
  user: PortalUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReactivateUserDialog({
  user,
  open,
  onOpenChange,
}: ReactivateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReactivate = async () => {
    setIsLoading(true);

    try {
      const result = await reactivateUserAction(user.id);

      if (result.success) {
        toast.success('User reactivated', {
          description: `${user.displayName || user.email} has been reactivated.`,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error('Failed to reactivate user', {
          description: result.error || 'An unknown error occurred.',
        });
      }
    } catch (error) {
      toast.error('Failed to reactivate user', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="reactivate-user-dialog">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-500/10 p-3">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Reactivate User</DialogTitle>
              <DialogDescription className="mt-1">
                Restore access for this user.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to reactivate{' '}
            <span className="font-medium text-foreground">
              {user.displayName || user.email}
            </span>
            ?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            The user will be able to log in and access their assigned applications again.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReactivate}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
            data-testid="confirm-reactivate-user"
          >
            {isLoading ? 'Reactivating...' : 'Reactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
