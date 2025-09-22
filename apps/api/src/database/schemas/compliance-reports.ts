import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Compliance Reports table - Regulatory reporting and submissions
 */
export const complianceReports = pgTable(
  'compliance_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    reportType: varchar('report_type', { length: 50 }).notNull(), // form_pr|severance_tax|royalty_report
    stateJurisdiction: varchar('state_jurisdiction', { length: 10 }).notNull(),
    reportingPeriodStart: date('reporting_period_start').notNull(),
    reportingPeriodEnd: date('reporting_period_end').notNull(),
    dueDate: date('due_date').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|submitted|approved|rejected
    formData: jsonb('form_data'),
    calculatedValues: jsonb('calculated_values'),
    submissionReference: varchar('submission_reference', { length: 100 }),
    submittedAt: timestamp('submitted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('compliance_reports_organization_id_idx').on(
      table.organizationId,
    ),
    createdByIdx: index('compliance_reports_created_by_idx').on(
      table.createdByUserId,
    ),
    reportTypeIdx: index('compliance_reports_report_type_idx').on(
      table.reportType,
    ),
    statusIdx: index('compliance_reports_status_idx').on(table.status),
    dueDateIdx: index('compliance_reports_due_date_idx').on(table.dueDate),
    periodIdx: index('compliance_reports_period_idx').on(
      table.reportingPeriodStart,
      table.reportingPeriodEnd,
    ),
  }),
);
