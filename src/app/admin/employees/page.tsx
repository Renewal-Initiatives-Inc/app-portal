import Link from 'next/link';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import { getAllEmployees } from '@/lib/db/employees';
import { Button } from '@/components/ui/button';
import { EmployeeTable } from '@/components/admin/employee-table';

export const metadata = {
  title: 'Employees | Admin Portal',
  description: 'Manage employee records',
};

async function EmployeesContent() {
  const employees = await getAllEmployees();
  return <EmployeeTable employees={employees} />;
}

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee compensation, withholding, and 990 data.
          </p>
        </div>
        <Button asChild data-testid="add-employee-button" className="w-full sm:w-auto">
          <Link href="/admin/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            New Employee
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="text-muted-foreground">Loading employees...</div>}>
        <EmployeesContent />
      </Suspense>
    </div>
  );
}
