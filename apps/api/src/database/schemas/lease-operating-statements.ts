import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { leases } from './leases';

/**
 * Lease Operating Statements table - Monthly operating expense statements
 */
export const leaseOperatingStatements = pgTable(
  'lease_operating_statements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    statementMonth: date('statement_month').notNull(),
    totalExpenses: decimal('total_expenses', { precision: 12, scale: 2 }),
    operatingExpenses: decimal('operating_expenses', {
      precision: 12,
      scale: 2,
    }),
    capitalExpenses: decimal('capital_expenses', { precision: 12, scale: 2 }),
    expenseBreakdown: jsonb('expense_breakdown'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|finalized|distributed
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('lease_operating_statements_organization_id_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('lease_operating_statements_lease_id_idx').on(
      table.leaseId,
    ),
    statementMonthIdx: index(
      'lease_operating_statements_statement_month_idx',
    ).on(table.statementMonth),
    statusIdx: index('lease_operating_statements_status_idx').on(table.status),
  }),
);
