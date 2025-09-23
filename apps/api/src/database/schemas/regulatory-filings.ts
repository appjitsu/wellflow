import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { users } from './users';

/**
 * Regulatory Filings table - Automated regulatory reporting and submissions
 */
export const regulatoryFilings = pgTable(
  'regulatory_filings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    filedByUserId: uuid('filed_by_user_id')
      .notNull()
      .references(() => users.id),
    filingType: varchar('filing_type', { length: 50 }).notNull(), // form_pr|w3x|h10|other
    regulatoryAgency: varchar('regulatory_agency', { length: 50 }).notNull(), // RRC|EPA|state_agency
    filingPeriod: varchar('filing_period', { length: 20 }).notNull(), // monthly|quarterly|annual
    reportingPeriodStart: date('reporting_period_start').notNull(),
    reportingPeriodEnd: date('reporting_period_end').notNull(),
    dueDate: date('due_date').notNull(),
    submissionDate: date('submission_date'),
    confirmationNumber: varchar('confirmation_number', { length: 100 }),
    filingData: jsonb('filing_data'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|submitted|accepted|rejected
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('regulatory_filings_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('regulatory_filings_well_id_idx').on(table.wellId),
    filingTypeIdx: index('regulatory_filings_filing_type_idx').on(
      table.filingType,
    ),
    regulatoryAgencyIdx: index('regulatory_filings_regulatory_agency_idx').on(
      table.regulatoryAgency,
    ),
    statusIdx: index('regulatory_filings_status_idx').on(table.status),
    dueDateIdx: index('regulatory_filings_due_date_idx').on(table.dueDate),
    reportingPeriodIdx: index('regulatory_filings_reporting_period_idx').on(
      table.reportingPeriodStart,
      table.reportingPeriodEnd,
    ),
  }),
);
