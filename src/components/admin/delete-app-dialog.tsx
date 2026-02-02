'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteAppAction } from '@/app/admin/apps/actions';
import { toast } from 'sonner';
import type { App } from '@/lib/db/apps';

interface DeleteAppDialogProps {
  app: App;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAppDialog({
  app,
  open,
  onOpenChange,
}: DeleteAppDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAppAction(app.id);

      if (result.success) {
        toast.success(`"${app.name}" has been deleted`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete app');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="delete-app-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete App
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>&quot;{app.name}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will remove the app from the registry. Users will no longer see
            it in the portal.
          </p>
          <p className="text-sm text-destructive mt-2 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            data-testid="confirm-delete-app"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
