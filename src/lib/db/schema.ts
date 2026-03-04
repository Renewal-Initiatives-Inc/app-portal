import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  integer,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const apps = pgTable('apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  appUrl: text('app_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  appId: uuid('app_id').references(() => apps.id),
  action: text('action').notNull(),
  beforeState: jsonb('before_state').$type<Record<string, unknown> | null>(),
  afterState: jsonb('after_state').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: text('admin_id').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----- Employee / Payroll tables -----
// Read by financial-system via the financial_system_reader role

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    zitadelUserId: text('zitadel_user_id').notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),

    // Compensation
    compensationType: text('compensation_type').notNull().default('PER_TASK'),
    annualSalary: numeric('annual_salary', { precision: 12, scale: 2 }),
    expectedAnnualHours: integer('expected_annual_hours'),
    exemptStatus: text('exempt_status').notNull().default('NON_EXEMPT'),
    workerType: text('worker_type').notNull().default('W-2'),
    payFrequency: text('pay_frequency').notNull().default('biweekly'),

    // Tax withholding
    federalFilingStatus: text('federal_filing_status').notNull().default('single'),
    federalAllowances: integer('federal_allowances').notNull().default(0),
    stateAllowances: integer('state_allowances').notNull().default(0),
    additionalFederalWithholding: numeric('additional_federal_withholding', {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default('0'),
    additionalStateWithholding: numeric('additional_state_withholding', {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default('0'),
    isHeadOfHousehold: boolean('is_head_of_household').notNull().default(false),
    isBlind: boolean('is_blind').notNull().default(false),
    spouseIsBlind: boolean('spouse_is_blind').notNull().default(false),

    // Encrypted PII
    dateOfBirth: text('date_of_birth'),
    taxId: text('tax_id'),
    stateTaxId: text('state_tax_id'),
    address: text('address'),

    // 990 Part VII
    isOfficer: boolean('is_officer').notNull().default(false),
    officerTitle: text('officer_title'),
    boardMember: boolean('board_member').notNull().default(false),
    avgHoursPerWeek: numeric('avg_hours_per_week', { precision: 5, scale: 1 }),
    employerHealthPremium: numeric('employer_health_premium', { precision: 10, scale: 2 }),
    employerRetirementContrib: numeric('employer_retirement_contrib', { precision: 10, scale: 2 }),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('employees_is_active_idx').on(table.isActive)]
);

export const payrollAuditLog = pgTable('payroll_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeZitadelUserId: text('employee_zitadel_user_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value').notNull(),
  changedBy: text('changed_by').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});
