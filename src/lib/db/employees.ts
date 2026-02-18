import { db } from '@/lib/db';
import { employees, payrollAuditLog } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

/**
 * Get all employees, sorted by name
 */
export async function getAllEmployees(): Promise<Employee[]> {
  return db.select().from(employees).orderBy(asc(employees.name));
}

/**
 * Get a single employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const results = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  return results[0] ?? null;
}

/**
 * Get all zitadelUserIds that are already linked to employees
 */
export async function getLinkedZitadelUserIds(): Promise<string[]> {
  const results = await db
    .select({ zitadelUserId: employees.zitadelUserId })
    .from(employees);
  return results.map((r) => r.zitadelUserId);
}

/**
 * Create a new employee
 */
export async function createEmployee(
  data: Omit<NewEmployee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Employee> {
  const results = await db
    .insert(employees)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return results[0];
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  id: string,
  data: Partial<Omit<NewEmployee, 'id' | 'createdAt'>>
): Promise<Employee | null> {
  const results = await db
    .update(employees)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Soft-delete: toggle isActive
 */
export async function setEmployeeActive(
  id: string,
  isActive: boolean
): Promise<Employee | null> {
  const results = await db
    .update(employees)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();

  return results[0] ?? null;
}

// Fields tracked in the payroll audit log
const TRACKED_FIELDS = [
  'compensationType',
  'annualSalary',
  'expectedAnnualHours',
  'exemptStatus',
  'federalFilingStatus',
  'federalAllowances',
  'stateAllowances',
  'additionalFederalWithholding',
  'additionalStateWithholding',
  'isHeadOfHousehold',
  'isBlind',
  'spouseIsBlind',
  'workerType',
  'payFrequency',
  'isOfficer',
  'officerTitle',
  'boardMember',
  'avgHoursPerWeek',
  'employerHealthPremium',
  'employerRetirementContrib',
  'isActive',
] as const;

/**
 * Log field-level changes to payroll_audit_log.
 * On create: oldRecord should be {} — all fields logged with oldValue null.
 * On update: diff old vs new, log only changed fields.
 */
export async function logPayrollChanges(
  employeeZitadelUserId: string,
  oldRecord: Partial<Employee>,
  newRecord: Partial<Employee>,
  changedBy: string
) {
  for (const field of TRACKED_FIELDS) {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];

    // On create (empty old), log everything that has a value
    const isCreate = Object.keys(oldRecord).length === 0;
    if (isCreate) {
      if (newVal !== undefined && newVal !== null) {
        await db.insert(payrollAuditLog).values({
          employeeZitadelUserId,
          fieldName: field,
          oldValue: null,
          newValue: String(newVal),
          changedBy,
        });
      }
    } else if (String(oldVal ?? '') !== String(newVal ?? '')) {
      await db.insert(payrollAuditLog).values({
        employeeZitadelUserId,
        fieldName: field,
        oldValue: oldVal != null ? String(oldVal) : null,
        newValue: String(newVal ?? ''),
        changedBy,
      });
    }
  }
}
