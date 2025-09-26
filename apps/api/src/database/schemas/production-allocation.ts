import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  varchar,
  text,
  jsonb,
  index,
  check,
  unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { leases } from './leases';
import { users } from './users';

/**
 * Production Allocation table - Well-to-lease production allocation tracking
 */
export const productionAllocation = pgTable(
  'production_allocation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    allocationPeriodStart: timestamp('allocation_period_start')
      .notNull()
      .defaultNow(),
    allocationPeriodEnd: timestamp('allocation_period_end').notNull(),
    allocationMethod: varchar('allocation_method', { length: 100 }).notNull(),
    allocationFactor: decimal('allocation_factor', {
      precision: 10,
      scale: 4,
    }).notNull(),
    allocatedOilVolume: decimal('allocated_oil_volume', {
      precision: 14,
      scale: 3,
    }),
    allocatedGasVolume: decimal('allocated_gas_volume', {
      precision: 14,
      scale: 3,
    }),
    allocatedWaterVolume: decimal('allocated_water_volume', {
      precision: 14,
      scale: 3,
    }),
    allocationConfidencePercent: decimal('allocation_confidence_percent', {
      precision: 5,
      scale: 2,
    }),
    measuredProduction: jsonb('measured_production'),
    allocationInputs: jsonb('allocation_inputs'),
    comments: text('comments'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('production_allocation_organization_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('production_allocation_lease_idx').on(table.leaseId),
    wellIdx: index('production_allocation_well_idx').on(table.wellId),
    periodIdx: index('production_allocation_period_idx').on(
      table.allocationPeriodStart,
      table.allocationPeriodEnd,
    ),
    uniquePeriodIdx: unique('production_allocation_unique_period').on(
      table.wellId,
      table.allocationPeriodStart,
      table.allocationPeriodEnd,
    ),
    positiveVolumesCheck: check(
      'production_allocation_positive_volumes_check',
      sql`(allocated_oil_volume IS NULL OR allocated_oil_volume >= 0)
          AND (allocated_gas_volume IS NULL OR allocated_gas_volume >= 0)
          AND (allocated_water_volume IS NULL OR allocated_water_volume >= 0)`,
    ),
    factorRangeCheck: check(
      'production_allocation_factor_range_check',
      sql`allocation_factor >= 0 AND allocation_factor <= 1`,
    ),
    periodChronologyCheck: check(
      'production_allocation_period_chronology_check',
      sql`allocation_period_end > allocation_period_start`,
    ),
    percentageBoundsCheck: check(
      'production_allocation_percentage_bounds_check',
      sql`allocation_confidence_percent IS NULL OR (allocation_confidence_percent >= 0 AND allocation_confidence_percent <= 100)`,
    ),
  }),
);
