import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  jsonb,
  index,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { wells } from './wells';
import { users } from './users';
import { wellPerformance } from './well-performance';

export const wellTestMethodEnum = pgEnum('well_test_method', [
  'FLOWING',
  'BUILDUP',
  'DRAW_DOWN',
  'MULTI_RATE',
  'INTERFERENCE',
  'PVT',
  'OTHER',
]);

export const wellTestValidationStatusEnum = pgEnum(
  'well_test_validation_status',
  ['PENDING', 'APPROVED', 'REJECTED'],
);

/**
 * Well Tests table - Periodic well performance testing
 */
export const wellTests = pgTable(
  'well_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    conductedByUserId: uuid('conducted_by_user_id')
      .notNull()
      .references(() => users.id),
    wellPerformanceId: uuid('well_performance_id').references(
      () => wellPerformance.id,
    ),
    testDate: date('test_date').notNull(),
    testType: varchar('test_type', { length: 20 }).notNull(), // initial|periodic|regulatory
    testMethod: wellTestMethodEnum('test_method'),
    validationStatus: wellTestValidationStatusEnum('validation_status')
      .notNull()
      .default('PENDING'),
    validationComments: text('validation_comments'),
    oilRate: decimal('oil_rate', { precision: 10, scale: 2 }),
    gasRate: decimal('gas_rate', { precision: 12, scale: 2 }),
    waterRate: decimal('water_rate', { precision: 10, scale: 2 }),
    flowingPressure: decimal('flowing_pressure', { precision: 8, scale: 2 }),
    staticPressure: decimal('static_pressure', { precision: 8, scale: 2 }),
    productivityIndex: decimal('productivity_index', {
      precision: 8,
      scale: 3,
    }),
    skinFactor: decimal('skin_factor', { precision: 8, scale: 3 }),
    reservoirPressure: decimal('reservoir_pressure', {
      precision: 8,
      scale: 2,
    }),
    bubblePointPressure: decimal('bubble_point_pressure', {
      precision: 8,
      scale: 2,
    }),
    gasOilRatio: decimal('gas_oil_ratio', { precision: 10, scale: 2 }),
    waterCutPercent: decimal('water_cut_percent', { precision: 5, scale: 2 }),
    testConditions: jsonb('test_conditions'),
    multiphaseFlowData: jsonb('multiphase_flow_data'),
    equipmentReadings: jsonb('equipment_readings'),
    validationMetadata: jsonb('validation_metadata'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wellIdx: index('well_tests_well_id_idx').on(table.wellId),
    conductedByIdx: index('well_tests_conducted_by_idx').on(
      table.conductedByUserId,
    ),
    testDateIdx: index('well_tests_test_date_idx').on(table.testDate),
    testTypeIdx: index('well_tests_test_type_idx').on(table.testType),
    wellDateIdx: index('well_tests_well_date_idx').on(
      table.wellId,
      table.testDate,
    ),
    ratePositiveCheck: check(
      'well_tests_rate_positive_check',
      sql`(oil_rate IS NULL OR oil_rate >= 0)
          AND (gas_rate IS NULL OR gas_rate >= 0)
          AND (water_rate IS NULL OR water_rate >= 0)`,
    ),
    percentRangeCheck: check(
      'well_tests_percent_range_check',
      sql`water_cut_percent IS NULL OR (water_cut_percent >= 0 AND water_cut_percent <= 100)`,
    ),
  }),
);
