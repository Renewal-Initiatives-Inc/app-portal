'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeactivateEmployeeDialog } from './deactivate-employee-dialog';
import type { Employee } from '@/lib/db/employees';

interface EmployeeRowActionsProps {
  employee: Employee;
}

export function EmployeeRowActions({ employee }: EmployeeRowActionsProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            data-testid={`employee-actions-${employee.id}`}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/employees/${employee.id}/edit`}
              className="flex items-center"
              data-testid={`edit-employee-${employee.id}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={
              employee.isActive
                ? 'text-destructive focus:text-destructive'
                : 'text-green-700 focus:text-green-700'
            }
            onSelect={(e) => {
              e.preventDefault();
              setShowDialog(true);
            }}
            data-testid={`toggle-employee-${employee.id}`}
          >
            {employee.isActive ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Reactivate
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeactivateEmployeeDialog
        employee={employee}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}
