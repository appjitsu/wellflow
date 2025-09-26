import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  text,
  jsonb,
  index,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { productionRecords } from './production-records';
import { users } from './users';

export const productionDataSourceEnum = pgEnum('production_data_source', [
  'SCADA',
  'MANUAL',
  'ALLOCATED',
  'SIMULATION',
  'OTHER',
]);

/**
 * Enhanced Production table - pressure, temperature, and allocation metrics
 */
export const enhancedProduction = pgTable(
  'enhanced_production',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    productionRecordId: uuid('production_record_id')
      .notNull()
      .references(() => productionRecords.id),
    recordedByUserId: uuid('recorded_by_user_id').references(() => users.id),
    measurementTimestamp: timestamp('measurement_timestamp')
      .notNull()
      .defaultNow(),
    dataSource: productionDataSourceEnum('data_source')
      .notNull()
      .default('SCADA'),
    separatorPressure: decimal('separator_pressure', {
      precision: 10,
      scale: 2,
    }),
    wellheadPressure: decimal('wellhead_pressure', {
      precision: 10,
      scale: 2,
    }),
    bottomHolePressure: decimal('bottom_hole_pressure', {
      precision: 10,
      scale: 2,
    }),
    tubingPressure: decimal('tubing_pressure', { precision: 10, scale: 2 }),
    casingPressure: decimal('casing_pressure', { precision: 10, scale: 2 }),
    flowingTemperature: decimal('flowing_temperature', {
      precision: 7,
      scale: 2,
    }),
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
    dataQualityScore: decimal('data_quality_score', {
      precision: 5,
      scale: 2,
    }),
    allocationDetails: jsonb('allocation_details'),
    analyticsSummary: text('analytics_summary'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('enhanced_production_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('enhanced_production_well_idx').on(table.wellId),
    measurementIdx: index('enhanced_production_measurement_idx').on(
      table.measurementTimestamp,
    ),
    positiveVolumesCheck: check(
      'enhanced_production_positive_volumes_check',
      sql`(allocated_oil_volume IS NULL OR allocated_oil_volume >= 0)
          AND (allocated_gas_volume IS NULL OR allocated_gas_volume >= 0)
          AND (allocated_water_volume IS NULL OR allocated_water_volume >= 0)`,
    ),
    percentageBoundsCheck: check(
      'enhanced_production_percentage_bounds_check',
      sql`(allocation_confidence_percent IS NULL OR (allocation_confidence_percent >= 0 AND allocation_confidence_percent <= 100))
          AND (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 100))`,
    ),
  }),
);
