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
import { toggleEmployeeActiveAction } from '@/app/admin/employees/actions';
import { toast } from 'sonner';
import type { Employee } from '@/lib/db/employees';

interface DeactivateEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateEmployeeDialog({
  employee,
  open,
  onOpenChange,
}: DeactivateEmployeeDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const action = employee.isActive ? 'Deactivate' : 'Reactivate';

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const result = await toggleEmployeeActiveAction(employee.id);

      if (result.success) {
        toast.success(
          `${employee.name} has been ${employee.isActive ? 'deactivated' : 'reactivated'}`
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${action.toLowerCase()} employee`);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="toggle-employee-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {action} Employee
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to {action.toLowerCase()}{' '}
            <strong>&quot;{employee.name}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {employee.isActive ? (
            <p className="text-sm text-muted-foreground">
              This employee will be marked inactive. Their records will be
              preserved for payroll history, but they will no longer appear in
              active employee lists.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              This will restore the employee to active status.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={employee.isActive ? 'destructive' : 'default'}
            onClick={handleToggle}
            disabled={isLoading}
            data-testid="confirm-toggle-employee"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {employee.isActive ? 'Deactivating...' : 'Reactivating...'}
              </>
            ) : (
              action
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
