import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Leases table - Oil & gas lease agreements
 * Contains legal and operational lease information
 */
export const leases = pgTable(
  'leases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    leaseNumber: varchar('lease_number', { length: 100 }),
    lessor: varchar('lessor', { length: 255 }).notNull(),
    lessee: varchar('lessee', { length: 255 }).notNull(),
    acreage: decimal('acreage', { precision: 10, scale: 4 }),
    royaltyRate: decimal('royalty_rate', { precision: 5, scale: 4 }), // e.g., 0.1875 for 18.75%
    effectiveDate: date('effective_date'),
    expirationDate: date('expiration_date'),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active|expired|terminated
    legalDescription: text('legal_description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('leases_organization_id_idx').on(
      table.organizationId,
    ),
    leaseNumberIdx: index('leases_lease_number_idx').on(table.leaseNumber),
    // Business rule constraints
    royaltyRateRangeCheck: check(
      'leases_royalty_rate_range_check',
      sql`royalty_rate IS NULL OR (royalty_rate >= 0 AND royalty_rate <= 1)`,
    ),
    acreagePositiveCheck: check(
      'leases_acreage_positive_check',
      sql`acreage IS NULL OR acreage > 0`,
    ),
    dateRangeCheck: check(
      'leases_date_range_check',
      sql`expiration_date IS NULL OR effective_date IS NULL OR effective_date <= expiration_date`,
    ),
  }),
);
