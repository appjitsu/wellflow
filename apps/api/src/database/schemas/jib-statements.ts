import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { partners } from './partners';
import { leases } from './leases';

import { cashCalls } from './cash-calls';

/**
 * JIB Statements table - Joint Interest Billing statements for partners
 */
export const jibStatements = pgTable(
  'jib_statements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    statementPeriodStart: date('statement_period_start').notNull(),
    statementPeriodEnd: date('statement_period_end').notNull(),
    grossRevenue: decimal('gross_revenue', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    netRevenue: decimal('net_revenue', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    workingInterestShare: decimal('working_interest_share', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),
    royaltyShare: decimal('royalty_share', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    lineItems: jsonb('line_items'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|sent|paid
    sentAt: timestamp('sent_at'),
    paidAt: timestamp('paid_at'),
    // Balances and due date
    previousBalance: decimal('previous_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    currentBalance: decimal('current_balance', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    dueDate: date('due_date'),

    // Optional link to cash call
    cashCallId: uuid('cash_call_id').references(() => cashCalls.id),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('jib_statements_organization_id_idx').on(
      table.organizationId,
    ),
    partnerIdx: index('jib_statements_partner_id_idx').on(table.partnerId),
    leaseIdx: index('jib_statements_lease_id_idx').on(table.leaseId),
    statusIdx: index('jib_statements_status_idx').on(table.status),
    periodIdx: index('jib_statements_period_idx').on(
      table.statementPeriodStart,
      table.statementPeriodEnd,
    ),
    partnerPeriodIdx: index('jib_statements_partner_period_idx').on(
      table.partnerId,
      table.statementPeriodStart,
    ),
    dueDateIdx: index('jib_statements_due_date_idx').on(table.dueDate),
    cashCallIdx: index('jib_statements_cash_call_idx').on(table.cashCallId),
  }),
);
