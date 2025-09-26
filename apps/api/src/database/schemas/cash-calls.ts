import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  date,
  varchar,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { leases } from './leases';
import { partners } from './partners';

/**
 * Cash Calls table - Advance billing and supplemental JV billings
 */
export const cashCalls = pgTable(
  'cash_calls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),

    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),

    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),

    billingMonth: date('billing_month').notNull(),
    dueDate: date('due_date'),

    amount: decimal('amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    type: varchar('type', { length: 20 }).notNull().default('MONTHLY'), // MONTHLY | SUPPLEMENTAL

    status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT | SENT | APPROVED | REJECTED | PAID | DEFAULTED

    interestRatePercent: decimal('interest_rate_percent', {
      precision: 5,
      scale: 2,
    }).default('0'),

    consentRequired: boolean('consent_required').default(false).notNull(),
    consentStatus: varchar('consent_status', { length: 20 })
      .notNull()
      .default('NOT_REQUIRED'), // NOT_REQUIRED | REQUIRED | RECEIVED | WAIVED
    consentReceivedAt: timestamp('consent_received_at'),

    approvedAt: timestamp('approved_at'),

    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('cash_calls_org_idx').on(table.organizationId),
    leaseIdx: index('cash_calls_lease_idx').on(table.leaseId),
    partnerIdx: index('cash_calls_partner_idx').on(table.partnerId),
    monthIdx: index('cash_calls_month_idx').on(table.billingMonth),
    statusIdx: index('cash_calls_status_idx').on(table.status),
  }),
);
