import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  text,
  date,
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

export const wellPerformanceStatusEnum = pgEnum('well_performance_status', [
  'OPTIMAL',
  'DECLINING',
  'INTERVENTION_REQUIRED',
  'SHUT_IN',
  'UNKNOWN',
]);

export const artificialLiftMethodEnum = pgEnum('artificial_lift_method', [
  'NATURAL_FLOW',
  'ROD_PUMP',
  'ESP',
  'GAS_LIFT',
  'PLUNGER_LIFT',
  'HYDRAULIC_PUMP',
  'PROGRESSING_CAVITY',
  'JET_PUMP',
  'OTHER',
]);

/**
 * Well Performance table - Performance monitoring and analytics
 */
export const wellPerformance = pgTable(
  'well_performance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    productionRecordId: uuid('production_record_id')
      .notNull()
      .references(() => productionRecords.id),
    analysisDate: date('analysis_date').notNull(),
    status: wellPerformanceStatusEnum('status').notNull().default('UNKNOWN'),
    artificialLiftMethod: artificialLiftMethodEnum('artificial_lift_method'),
    oilRate: decimal('oil_rate', { precision: 14, scale: 3 }),
    gasRate: decimal('gas_rate', { precision: 14, scale: 3 }),
    waterRate: decimal('water_rate', { precision: 14, scale: 3 }),
    averageTubingPressure: decimal('average_tubing_pressure', {
      precision: 10,
      scale: 2,
    }),
    averageCasingPressure: decimal('average_casing_pressure', {
      precision: 10,
      scale: 2,
    }),
    bottomHolePressure: decimal('bottom_hole_pressure', {
      precision: 10,
      scale: 2,
    }),
    reservoirPressure: decimal('reservoir_pressure', {
      precision: 10,
      scale: 2,
    }),
    gasOilRatio: decimal('gas_oil_ratio', { precision: 10, scale: 2 }),
    waterCutPercent: decimal('water_cut_percent', { precision: 5, scale: 2 }),
    bswPercent: decimal('bsw_percent', { precision: 5, scale: 2 }),
    apiGravity: decimal('api_gravity', { precision: 6, scale: 2 }),
    productivityIndex: decimal('productivity_index', {
      precision: 8,
      scale: 3,
    }),
    drawdownPressure: decimal('drawdown_pressure', {
      precision: 10,
      scale: 2,
    }),
    pumpSpeed: decimal('pump_speed', { precision: 8, scale: 2 }),
    pumpingFluidLevel: decimal('pumping_fluid_level', {
      precision: 10,
      scale: 2,
    }),
    downtimeHours: decimal('downtime_hours', { precision: 8, scale: 2 }),
    downtimeReason: text('downtime_reason'),
    downtimeDetails: jsonb('downtime_details'),
    optimizationRecommendations: text('optimization_recommendations'),
    performanceSummary: text('performance_summary'),
    performanceMetrics: jsonb('performance_metrics'),
    benchmarkComparison: jsonb('benchmark_comparison'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('well_performance_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('well_performance_well_idx').on(table.wellId),
    analysisDateIdx: index('well_performance_analysis_date_idx').on(
      table.analysisDate,
    ),
    performanceStatusIdx: index('well_performance_status_lookup').on(
      table.status,
    ),
    productionRecordIdx: index('well_performance_production_record_idx').on(
      table.productionRecordId,
    ),
    ratePositiveCheck: check(
      'well_performance_rate_positive_check',
      sql`(oil_rate IS NULL OR oil_rate >= 0)
          AND (gas_rate IS NULL OR gas_rate >= 0)
          AND (water_rate IS NULL OR water_rate >= 0)`,
    ),
    percentRangeCheck: check(
      'well_performance_percent_range_check',
      sql`
        (water_cut_percent IS NULL OR (water_cut_percent >= 0 AND water_cut_percent <= 100))
        AND (bsw_percent IS NULL OR (bsw_percent >= 0 AND bsw_percent <= 100))
      `,
    ),
  }),
);
