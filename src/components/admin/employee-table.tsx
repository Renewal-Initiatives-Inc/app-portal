import { Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmployeeRowActions } from './employee-row-actions';
import type { Employee } from '@/lib/db/employees';

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="employees-empty-state"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No employees yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Add your first employee to start managing compensation and
          withholding.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border overflow-x-auto"
      data-testid="employees-table"
    >
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Comp Type</TableHead>
            <TableHead className="hidden lg:table-cell">Exempt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.id} data-testid={`employee-row-${emp.id}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {emp.email}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <span className="text-sm text-muted-foreground">
                  {emp.email}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className="text-xs">
                  {emp.compensationType === 'SALARIED' ? 'Salaried' : 'Per Task'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                  {emp.exemptStatus === 'EXEMPT' ? 'Exempt' : 'Non-Exempt'}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={emp.isActive ? 'default' : 'secondary'}
                  className={
                    emp.isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                  }
                >
                  {emp.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <EmployeeRowActions employee={emp} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
