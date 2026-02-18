import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmployeeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-semibold">Employee Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The employee record you&apos;re looking for doesn&apos;t exist or may
        have been removed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin/employees">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Link>
      </Button>
    </div>
  );
}
