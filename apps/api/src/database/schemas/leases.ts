import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  index,
} from 'drizzle-orm/pg-core';
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
  }),
);
