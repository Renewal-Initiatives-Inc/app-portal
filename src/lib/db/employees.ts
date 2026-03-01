import { db } from '@/lib/db';
import { employees, payrollAuditLog } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { encryptPII, decryptPII } from '@/lib/encryption';
import type { DbTransaction } from '@/lib/db/audit-logs';

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

/** PII fields that are encrypted at rest using AES-256-GCM. */
const PII_FIELDS = ['taxId', 'stateTaxId', 'address'] as const;

/**
 * Encrypt PII fields before writing to the database.
 * Null/undefined values pass through unchanged.
 */
function encryptPIIFields<T extends Partial<Pick<Employee, 'taxId' | 'stateTaxId' | 'address'>>>(
  data: T
): T {
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (result[field] != null && result[field] !== '') {
      (result as Record<string, unknown>)[field] = encryptPII(result[field] as string);
    }
  }
  return result;
}

/**
 * Decrypt PII fields after reading from the database.
 * Null values and plaintext values (migration not yet run) pass through unchanged.
 */
function decryptPIIFields<T extends Partial<Pick<Employee, 'taxId' | 'stateTaxId' | 'address'>>>(
  data: T
): T {
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (result[field] != null && result[field] !== '') {
      try {
        (result as Record<string, unknown>)[field] = decryptPII(result[field] as string);
      } catch {
        // Value is likely still plaintext (pre-migration) — pass through as-is
      }
    }
  }
  return result;
}

/**
 * Get all employees, sorted by name
 */
export async function getAllEmployees(): Promise<Employee[]> {
  const rows = await db.select().from(employees).orderBy(asc(employees.name));
  return rows.map(decryptPIIFields);
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
  const row = results[0] ?? null;
  return row ? decryptPIIFields(row) : null;
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
 * Create a new employee. Accepts optional transaction context.
 */
export async function createEmployee(
  data: Omit<NewEmployee, 'id' | 'createdAt' | 'updatedAt'>,
  tx?: DbTransaction
): Promise<Employee> {
  const executor = tx ?? db;
  const encrypted = encryptPIIFields(data);
  const results = await executor
    .insert(employees)
    .values({
      ...encrypted,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return decryptPIIFields(results[0]);
}

/**
 * Update an existing employee. Accepts optional transaction context.
 */
export async function updateEmployee(
  id: string,
  data: Partial<Omit<NewEmployee, 'id' | 'createdAt'>>,
  tx?: DbTransaction
): Promise<Employee | null> {
  const executor = tx ?? db;
  const encrypted = encryptPIIFields(data);
  const results = await executor
    .update(employees)
    .set({
      ...encrypted,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id))
    .returning();

  const row = results[0] ?? null;
  return row ? decryptPIIFields(row) : null;
}

/**
 * Soft-delete: toggle isActive. Accepts optional transaction context.
 */
export async function setEmployeeActive(
  id: string,
  isActive: boolean,
  tx?: DbTransaction
): Promise<Employee | null> {
  const executor = tx ?? db;
  const results = await executor
    .update(employees)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();

  const row = results[0] ?? null;
  return row ? decryptPIIFields(row) : null;
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
  changedBy: string,
  tx?: DbTransaction
) {
  const executor = tx ?? db;
  for (const field of TRACKED_FIELDS) {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];

    // On create (empty old), log everything that has a value
    const isCreate = Object.keys(oldRecord).length === 0;
    if (isCreate) {
      if (newVal !== undefined && newVal !== null) {
        await executor.insert(payrollAuditLog).values({
          employeeZitadelUserId,
          fieldName: field,
          oldValue: null,
          newValue: String(newVal),
          changedBy,
        });
      }
    } else if (String(oldVal ?? '') !== String(newVal ?? '')) {
      await executor.insert(payrollAuditLog).values({
        employeeZitadelUserId,
        fieldName: field,
        oldValue: oldVal != null ? String(oldVal) : null,
        newValue: String(newVal ?? ''),
        changedBy,
      });
    }
  }
}
