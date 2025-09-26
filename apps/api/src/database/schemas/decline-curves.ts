import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  varchar,
  text,
  date,
  index,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { reserves } from './reserves';
import { users } from './users';

export const declineCurveMethodEnum = pgEnum('decline_curve_method', [
  'ARPS',
  'DUONG',
  'MODIFIED_ARPS',
  'EXPONENTIAL',
  'HARMONIC',
  'HYPERBOLIC',
  'OTHER',
]);

/**
 * Decline Curves table - Arps decline analysis and EUR calculations
 */
export const declineCurves = pgTable(
  'decline_curves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    reservesId: uuid('reserves_id').references(() => reserves.id),
    analysisDate: date('analysis_date').notNull(),
    method: declineCurveMethodEnum('method').notNull().default('ARPS'),
    phase: varchar('phase', { length: 16 }).notNull().default('OIL'),
    initialRate: decimal('initial_rate', {
      precision: 14,
      scale: 3,
    }),
    declineRate: decimal('decline_rate', { precision: 10, scale: 6 }),
    declineExponent: decimal('decline_exponent', { precision: 10, scale: 6 }),
    eur: decimal('eur', { precision: 18, scale: 3 }),
    cumulativeProductionToDate: decimal('cumulative_production_to_date', {
      precision: 18,
      scale: 3,
    }),
    forecastHorizonDate: date('forecast_horizon_date'),
    modelParameters: text('model_parameters'),
    modelFitMetrics: text('model_fit_metrics'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    comments: text('comments'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('decline_curves_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('decline_curves_well_idx').on(table.wellId),
    reservesIdx: index('decline_curves_reserves_idx').on(table.reservesId),
    analysisDateIdx: index('decline_curves_analysis_date_idx').on(
      table.analysisDate,
    ),
    phaseIdx: index('decline_curves_phase_idx').on(table.phase),
    positiveEurCheck: check(
      'decline_curves_positive_eur_check',
      sql`eur IS NULL OR eur >= 0`,
    ),
  }),
);
