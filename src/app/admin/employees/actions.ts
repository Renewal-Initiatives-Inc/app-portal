'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import {
  createEmployee,
  updateEmployee,
  setEmployeeActive,
  getEmployeeById,
  logPayrollChanges,
} from '@/lib/db/employees';
import { db } from '@/lib/db';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/db/audit-logs';
import { checkActionRateLimit } from '@/lib/rate-limit';
import type { Employee } from '@/lib/db/employees';

/** Build a sanitized state snapshot for audit logs (excludes encrypted PII). */
function employeeAuditState(emp: Partial<Employee>): Record<string, unknown> {
  return {
    name: emp.name,
    email: emp.email,
    isActive: emp.isActive,
    compensationType: emp.compensationType,
    workerType: emp.workerType,
    payFrequency: emp.payFrequency,
    exemptStatus: emp.exemptStatus,
  };
}

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function verifyAdminAccess(): Promise<{
  authorized: boolean;
  error?: string;
  userId?: string;
  userEmail?: string;
}> {
  const session = await auth();

  if (!session) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const userRoles = session.user.roles || [];
  if (!isAdmin(userRoles)) {
    return { authorized: false, error: 'Admin access required' };
  }

  return {
    authorized: true,
    userId: session.user.id,
    userEmail: session.user.email || 'unknown',
  };
}

// --- Zod schemas ---

const createEmployeeSchema = z.object({
  zitadelUserId: z.string().min(1, 'Must select a user'),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Valid email required').max(255),
  workerType: z.enum(['W-2', '1099']),
  payFrequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']),
  compensationType: z.enum(['PER_TASK', 'SALARIED']),
  annualSalary: z.coerce.number().min(0).optional().nullable(),
  expectedAnnualHours: z.coerce.number().int().min(0).optional().nullable(),
  exemptStatus: z.enum(['EXEMPT', 'NON_EXEMPT']),
  federalFilingStatus: z.enum([
    'single',
    'married',
    'married_separate',
    'head_of_household',
  ]),
  federalAllowances: z.coerce.number().int().min(0).default(0),
  stateAllowances: z.coerce.number().int().min(0).default(0),
  additionalFederalWithholding: z.coerce.number().min(0).default(0),
  additionalStateWithholding: z.coerce.number().min(0).default(0),
  isHeadOfHousehold: z.coerce.boolean().default(false),
  isBlind: z.coerce.boolean().default(false),
  spouseIsBlind: z.coerce.boolean().default(false),
  // 990 fields (P1)
  isOfficer: z.coerce.boolean().default(false),
  officerTitle: z.string().max(255).optional().nullable(),
  boardMember: z.coerce.boolean().default(false),
  avgHoursPerWeek: z.coerce.number().min(0).optional().nullable(),
  employerHealthPremium: z.coerce.number().min(0).optional().nullable(),
  employerRetirementContrib: z.coerce.number().min(0).optional().nullable(),
  // PII
  taxId: z.string().max(20).optional().nullable(),
  stateTaxId: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

const updateEmployeeSchema = createEmployeeSchema.omit({
  zitadelUserId: true,
});

// --- Actions ---

export async function createEmployeeAction(
  formData: FormData
): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  const rawData = Object.fromEntries(formData.entries());

  // Convert checkbox fields: FormData sends "on" or omits them
  for (const boolField of [
    'isHeadOfHousehold',
    'isBlind',
    'spouseIsBlind',
    'isOfficer',
    'boardMember',
  ]) {
    rawData[boolField] = rawData[boolField] === 'on' ? 'true' : '';
  }

  const result = createEmployeeSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await db.transaction(async (tx) => {
      const employee = await createEmployee({
        zitadelUserId: result.data.zitadelUserId,
        name: result.data.name,
        email: result.data.email,
        isActive: true,
        workerType: result.data.workerType,
        payFrequency: result.data.payFrequency,
        compensationType: result.data.compensationType,
        annualSalary: result.data.annualSalary != null
          ? String(result.data.annualSalary)
          : null,
        expectedAnnualHours: result.data.expectedAnnualHours ?? null,
        exemptStatus: result.data.exemptStatus,
        federalFilingStatus: result.data.federalFilingStatus,
        federalAllowances: result.data.federalAllowances,
        stateAllowances: result.data.stateAllowances,
        additionalFederalWithholding: String(
          result.data.additionalFederalWithholding
        ),
        additionalStateWithholding: String(
          result.data.additionalStateWithholding
        ),
        isHeadOfHousehold: result.data.isHeadOfHousehold,
        isBlind: result.data.isBlind,
        spouseIsBlind: result.data.spouseIsBlind,
        isOfficer: result.data.isOfficer,
        officerTitle: result.data.officerTitle ?? null,
        boardMember: result.data.boardMember,
        avgHoursPerWeek: result.data.avgHoursPerWeek != null
          ? String(result.data.avgHoursPerWeek)
          : null,
        employerHealthPremium: result.data.employerHealthPremium != null
          ? String(result.data.employerHealthPremium)
          : null,
        employerRetirementContrib: result.data.employerRetirementContrib != null
          ? String(result.data.employerRetirementContrib)
          : null,
        taxId: result.data.taxId ?? null,
        stateTaxId: result.data.stateTaxId ?? null,
        address: result.data.address ?? null,
      }, tx);

      await logPayrollChanges(
        employee.zitadelUserId,
        {},
        employee,
        accessCheck.userEmail!,
        tx
      );

      await logAuditEvent(
        accessCheck.userId!,
        accessCheck.userEmail!,
        AUDIT_ACTIONS.EMPLOYEE_CREATED,
        null,
        { tx, afterState: employeeAuditState(employee) }
      );
    });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Failed to create employee:', error);
    return { success: false, error: 'Failed to create employee' };
  }
}

export async function updateEmployeeAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  const existing = await getEmployeeById(id);
  if (!existing) {
    return { success: false, error: 'Employee not found' };
  }

  const rawData = Object.fromEntries(formData.entries());

  for (const boolField of [
    'isHeadOfHousehold',
    'isBlind',
    'spouseIsBlind',
    'isOfficer',
    'boardMember',
  ]) {
    rawData[boolField] = rawData[boolField] === 'on' ? 'true' : '';
  }

  const result = updateEmployeeSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const beforeState = employeeAuditState(existing);

    await db.transaction(async (tx) => {
      const updated = await updateEmployee(id, {
        name: result.data.name,
        email: result.data.email,
        workerType: result.data.workerType,
        payFrequency: result.data.payFrequency,
        compensationType: result.data.compensationType,
        annualSalary: result.data.annualSalary != null
          ? String(result.data.annualSalary)
          : null,
        expectedAnnualHours: result.data.expectedAnnualHours ?? null,
        exemptStatus: result.data.exemptStatus,
        federalFilingStatus: result.data.federalFilingStatus,
        federalAllowances: result.data.federalAllowances,
        stateAllowances: result.data.stateAllowances,
        additionalFederalWithholding: String(
          result.data.additionalFederalWithholding
        ),
        additionalStateWithholding: String(
          result.data.additionalStateWithholding
        ),
        isHeadOfHousehold: result.data.isHeadOfHousehold,
        isBlind: result.data.isBlind,
        spouseIsBlind: result.data.spouseIsBlind,
        isOfficer: result.data.isOfficer,
        officerTitle: result.data.officerTitle ?? null,
        boardMember: result.data.boardMember,
        avgHoursPerWeek: result.data.avgHoursPerWeek != null
          ? String(result.data.avgHoursPerWeek)
          : null,
        employerHealthPremium: result.data.employerHealthPremium != null
          ? String(result.data.employerHealthPremium)
          : null,
        employerRetirementContrib: result.data.employerRetirementContrib != null
          ? String(result.data.employerRetirementContrib)
          : null,
        taxId: result.data.taxId ?? null,
        stateTaxId: result.data.stateTaxId ?? null,
        address: result.data.address ?? null,
      }, tx);

      if (updated) {
        await logPayrollChanges(
          existing.zitadelUserId,
          existing,
          updated,
          accessCheck.userEmail!,
          tx
        );

        await logAuditEvent(
          accessCheck.userId!,
          accessCheck.userEmail!,
          AUDIT_ACTIONS.EMPLOYEE_UPDATED,
          null,
          { tx, beforeState, afterState: employeeAuditState(updated) }
        );
      }
    });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Failed to update employee:', error);
    return { success: false, error: 'Failed to update employee' };
  }
}

export async function toggleEmployeeActiveAction(
  id: string
): Promise<ActionResult> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { success: false, error: accessCheck.error };
  }

  const rateCheck = await checkActionRateLimit(accessCheck.userId);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please try again shortly.' };
  }

  const existing = await getEmployeeById(id);
  if (!existing) {
    return { success: false, error: 'Employee not found' };
  }

  try {
    const beforeState = employeeAuditState(existing);

    await db.transaction(async (tx) => {
      const updated = await setEmployeeActive(id, !existing.isActive, tx);

      if (updated) {
        await logPayrollChanges(
          existing.zitadelUserId,
          existing,
          updated,
          accessCheck.userEmail!,
          tx
        );

        await logAuditEvent(
          accessCheck.userId!,
          accessCheck.userEmail!,
          AUDIT_ACTIONS.EMPLOYEE_DEACTIVATED,
          null,
          { tx, beforeState, afterState: employeeAuditState(updated) }
        );
      }
    });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle employee status:', error);
    return { success: false, error: 'Failed to update employee status' };
  }
}

/**
 * Server action to fetch Zitadel users not yet linked to an employee.
 * Called by the new-employee form to populate the user picker.
 */
export async function getUnlinkedZitadelUsersAction(): Promise<{
  users: { id: string; displayName: string; email: string }[];
  error?: string;
}> {
  const accessCheck = await verifyAdminAccess();
  if (!accessCheck.authorized) {
    return { users: [], error: accessCheck.error };
  }

  try {
    const { listUsers } = await import('@/lib/zitadel/users');
    const { getLinkedZitadelUserIds } = await import('@/lib/db/employees');

    const [allUsers, linkedIds] = await Promise.all([
      listUsers(),
      getLinkedZitadelUserIds(),
    ]);

    const linkedSet = new Set(linkedIds);
    const unlinked = allUsers
      .filter((u) => !linkedSet.has(u.id))
      .map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
      }));

    return { users: unlinked };
  } catch (error) {
    console.error('Failed to fetch unlinked users:', error);
    return { users: [], error: 'Failed to load users' };
  }
}
