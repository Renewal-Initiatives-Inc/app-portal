import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EmployeeForm } from '@/components/admin/employee-form';

export const metadata = {
  title: 'New Employee | Admin Portal',
  description: 'Add a new employee record',
};

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/employees"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">New Employee</h1>
        <p className="text-muted-foreground mt-1">
          Link a Zitadel user and set up their compensation profile.
        </p>
      </div>

      <EmployeeForm mode="create" />
    </div>
  );
}
