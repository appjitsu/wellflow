import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  date,
  varchar,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { partners } from './partners';
import { revenueDistributions } from './revenue-distributions';

/**
 * Owner Payments table - Payments to royalty and working interest owners
 */
export const ownerPayments = pgTable(
  'owner_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    revenueDistributionId: uuid('revenue_distribution_id')
      .notNull()
      .references(() => revenueDistributions.id),

    paymentDate: date('payment_date'),
    paymentMethod: varchar('payment_method', { length: 20 })
      .notNull()
      .default('CHECK'), // CHECK | ACH | WIRE
    checkNumber: varchar('check_number', { length: 50 }),
    achTraceNumber: varchar('ach_trace_number', { length: 50 }),

    grossAmount: decimal('gross_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    deductions: decimal('deductions', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    taxWithholding: decimal('tax_withholding', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),
    netAmount: decimal('net_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0'),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING | PROCESSED | CLEARED | VOID | REVERSED | FAILED
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('owner_payments_org_idx').on(table.organizationId),
    partnerIdx: index('owner_payments_partner_idx').on(table.partnerId),
    rdIdx: index('owner_payments_rd_idx').on(table.revenueDistributionId),
    statusIdx: index('owner_payments_status_idx').on(table.status),
    dateIdx: index('owner_payments_date_idx').on(table.paymentDate),
  }),
);
