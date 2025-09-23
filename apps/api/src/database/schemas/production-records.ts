import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';

/**
 * Production Records table - Daily/monthly production data
 * Tracks oil, gas, and water production volumes
 */
export const productionRecords = pgTable(
  'production_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    productionDate: date('production_date').notNull(),
    oilVolume: decimal('oil_volume', { precision: 10, scale: 2 }), // barrels
    gasVolume: decimal('gas_volume', { precision: 12, scale: 2 }), // MCF
    waterVolume: decimal('water_volume', { precision: 10, scale: 2 }), // barrels
    oilPrice: decimal('oil_price', { precision: 8, scale: 4 }), // $/barrel
    gasPrice: decimal('gas_price', { precision: 8, scale: 4 }), // $/MCF
    runTicket: varchar('run_ticket', { length: 100 }),
    comments: text('comments'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('production_records_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('production_records_well_id_idx').on(table.wellId),
    dateIdx: index('production_records_production_date_idx').on(
      table.productionDate,
    ),
    wellDateIdx: unique('production_records_well_date_unique').on(
      table.wellId,
      table.productionDate,
    ),
    // Business rule constraints - production volumes must be non-negative
    positiveVolumesCheck: check(
      'production_records_positive_volumes_check',
      sql`(oil_volume IS NULL OR oil_volume >= 0) AND
          (gas_volume IS NULL OR gas_volume >= 0) AND
          (water_volume IS NULL OR water_volume >= 0)`,
    ),
    positivePricesCheck: check(
      'production_records_positive_prices_check',
      sql`(oil_price IS NULL OR oil_price >= 0) AND
          (gas_price IS NULL OR gas_price >= 0)`,
    ),
  }),
);
