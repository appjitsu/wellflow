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
} from 'drizzle-orm/pg-core';
import { wells } from './wells';
import { users } from './users';

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
    testDate: date('test_date').notNull(),
    testType: varchar('test_type', { length: 20 }).notNull(), // initial|periodic|regulatory
    oilRate: decimal('oil_rate', { precision: 10, scale: 2 }),
    gasRate: decimal('gas_rate', { precision: 12, scale: 2 }),
    waterRate: decimal('water_rate', { precision: 10, scale: 2 }),
    flowingPressure: decimal('flowing_pressure', { precision: 8, scale: 2 }),
    staticPressure: decimal('static_pressure', { precision: 8, scale: 2 }),
    testConditions: jsonb('test_conditions'),
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
  }),
);
