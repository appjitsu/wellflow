import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  date,
  index,
  unique,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { leases } from './leases';

// Well type enum
export const wellTypeEnum = pgEnum('well_type', [
  'OIL',
  'GAS',
  'OIL_AND_GAS',
  'INJECTION',
  'DISPOSAL',
  'WATER',
  'OTHER',
  'oil', // Legacy support
  'gas', // Legacy support
  'injection', // Legacy support
  'disposal', // Legacy support
]);

// Well status enum
export const wellStatusEnum = pgEnum('well_status', [
  'active',
  'inactive',
  'plugged',
  'drilling',
]);

/**
 * Wells table - Individual well records with API numbers
 * Core operational entity for production tracking
 */
export const wells = pgTable(
  'wells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    apiNumber: varchar('api_number', { length: 14 }).notNull(), // 14-digit API number
    wellName: varchar('well_name', { length: 255 }).notNull(),
    wellNumber: varchar('well_number', { length: 50 }),
    wellType: wellTypeEnum('well_type').notNull(),
    status: wellStatusEnum('status').notNull().default('active'),
    spudDate: date('spud_date'),
    completionDate: date('completion_date'),
    totalDepth: decimal('total_depth', { precision: 8, scale: 2 }), // feet with decimal precision
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    operator: varchar('operator', { length: 255 }),
    field: varchar('field', { length: 255 }),
    formation: varchar('formation', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    apiNumberIdx: unique('wells_api_number_unique').on(table.apiNumber),
    organizationIdx: index('wells_organization_id_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('wells_lease_id_idx').on(table.leaseId),
    // Business rule constraints
    apiNumberFormatCheck: check(
      'wells_api_number_format_check',
      sql`LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$'`,
    ),
    totalDepthPositiveCheck: check(
      'wells_total_depth_positive_check',
      sql`total_depth IS NULL OR total_depth >= 0`,
    ),
  }),
);
