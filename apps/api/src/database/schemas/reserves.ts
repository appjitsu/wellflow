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
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { partners } from './partners';
import { leases } from './leases';

export const reservesCategoryEnum = pgEnum('reserves_category', [
  'PROVED_DEVELOPED_PRODUCING',
  'PROVED_DEVELOPED_NON_PRODUCING',
  'PROVED_UNDEVELOPED',
  'PROBABLE',
  'POSSIBLE',
]);

export const reservesClassificationEnum = pgEnum('reserves_classification', [
  'SEC',
  'PRMS',
  'OTHER',
]);

/**
 * Reserves table - SEC-compliant reserves evaluation and reporting
 */
export const reserves = pgTable(
  'reserves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    field: varchar('field', { length: 255 }),
    evaluatorPartnerId: uuid('evaluator_partner_id').references(
      () => partners.id,
    ),
    category: reservesCategoryEnum('category').notNull(),
    classification: reservesClassificationEnum('classification')
      .notNull()
      .default('SEC'),
    evaluationDate: date('evaluation_date').notNull(),
    netOilReserves: decimal('net_oil_reserves', {
      precision: 18,
      scale: 2,
    }),
    netGasReserves: decimal('net_gas_reserves', {
      precision: 18,
      scale: 2,
    }),
    netNglReserves: decimal('net_ngl_reserves', {
      precision: 18,
      scale: 2,
    }),
    netOilReservesWorkingInterest: decimal(
      'net_oil_reserves_working_interest',
      {
        precision: 18,
        scale: 2,
      },
    ),
    netGasReservesWorkingInterest: decimal(
      'net_gas_reserves_working_interest',
      {
        precision: 18,
        scale: 2,
      },
    ),
    netNglReservesWorkingInterest: decimal(
      'net_ngl_reserves_working_interest',
      {
        precision: 18,
        scale: 2,
      },
    ),
    presentValue10: decimal('present_value_10', {
      precision: 18,
      scale: 2,
    }),
    presentValueDiscountRate: decimal('present_value_discount_rate', {
      precision: 7,
      scale: 4,
    }),
    economicLimitDate: date('economic_limit_date'),
    priceDeck: text('price_deck'),
    operatingCostAssumptions: text('operating_cost_assumptions'),
    capitalCostAssumptions: text('capital_cost_assumptions'),
    workingInterestPercent: decimal('working_interest_percent', {
      precision: 6,
      scale: 3,
    }),
    netRevenueInterestPercent: decimal('net_revenue_interest_percent', {
      precision: 6,
      scale: 3,
    }),
    recoveryFactorPercent: decimal('recovery_factor_percent', {
      precision: 6,
      scale: 3,
    }),
    comments: text('comments'),
    economicAssumptions: jsonb('economic_assumptions'),
    forecastScenarios: jsonb('forecast_scenarios'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('reserves_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('reserves_well_idx').on(table.wellId),
    evaluationDateIdx: index('reserves_evaluation_date_idx').on(
      table.evaluationDate,
    ),
    categoryClassificationIdx: index('reserves_cat_class_idx').on(
      table.category,
      table.classification,
    ),
    positiveReservesCheck: check(
      'reserves_positive_reserves_check',
      sql`(net_oil_reserves IS NULL OR net_oil_reserves >= 0)
          AND (net_gas_reserves IS NULL OR net_gas_reserves >= 0)
          AND (net_ngl_reserves IS NULL OR net_ngl_reserves >= 0)
          AND (net_oil_reserves_working_interest IS NULL OR net_oil_reserves_working_interest >= 0)
          AND (net_gas_reserves_working_interest IS NULL OR net_gas_reserves_working_interest >= 0)
          AND (net_ngl_reserves_working_interest IS NULL OR net_ngl_reserves_working_interest >= 0)`,
    ),
    interestPercentageBoundsCheck: check(
      'reserves_interest_percentage_bounds_check',
      sql`
        (working_interest_percent IS NULL OR (working_interest_percent >= 0 AND working_interest_percent <= 100))
        AND (net_revenue_interest_percent IS NULL OR (net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 100))
        AND (recovery_factor_percent IS NULL OR (recovery_factor_percent >= 0 AND recovery_factor_percent <= 100))
      `,
    ),
    discountRateBoundsCheck: check(
      'reserves_discount_rate_bounds_check',
      sql`present_value_discount_rate IS NULL OR (present_value_discount_rate >= 0 AND present_value_discount_rate <= 1)`,
    ),
  }),
);
