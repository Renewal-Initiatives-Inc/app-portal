import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getEmployeeById } from '@/lib/db/employees';
import { EmployeeForm } from '@/components/admin/employee-form';

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEmployeePageProps) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    return { title: 'Employee Not Found | Admin Portal' };
  }

  return {
    title: `Edit ${employee.name} | Admin Portal`,
    description: `Edit ${employee.name} employee record`,
  };
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

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
        <h1 className="text-2xl font-semibold text-foreground">
          Edit {employee.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Update compensation, withholding, and 990 data.
        </p>
      </div>

      <EmployeeForm employee={employee} mode="edit" />
    </div>
  );
}
