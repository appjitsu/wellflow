import {
  pgTable,
  uuid,
  timestamp,
  boolean,
  decimal,
  date,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { leases } from './leases';
import { partners } from './partners';

/**
 * Lease Partners table - Ownership interests in specific leases
 * Many-to-many relationship between leases and partners
 */
export const leasePartners = pgTable(
  'lease_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    workingInterestPercent: decimal('working_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    royaltyInterestPercent: decimal('royalty_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    netRevenueInterestPercent: decimal('net_revenue_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),
    isOperator: boolean('is_operator').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    leasePartnerIdx: index('lease_partners_lease_partner_idx').on(
      table.leaseId,
      table.partnerId,
    ),
    leaseIdx: index('lease_partners_lease_id_idx').on(table.leaseId),
    partnerIdx: index('lease_partners_partner_id_idx').on(table.partnerId),
    effectiveDateIdx: index('lease_partners_effective_date_idx').on(
      table.effectiveDate,
    ),
    // Business rule constraints - percentage validation (0-100%)
    percentageRangeCheck: check(
      'lease_partners_percentage_range_check',
      sql`working_interest_percent >= 0 AND working_interest_percent <= 1 AND
          royalty_interest_percent >= 0 AND royalty_interest_percent <= 1 AND
          net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 1`,
    ),
    // Ensure effective date is before end date when end date is specified
    dateRangeCheck: check(
      'lease_partners_date_range_check',
      sql`end_date IS NULL OR effective_date <= end_date`,
    ),
  }),
);
