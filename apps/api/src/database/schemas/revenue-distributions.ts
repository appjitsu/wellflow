import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  decimal,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { partners } from './partners';
import { divisionOrders } from './division-orders';

/**
 * Revenue Distributions table - Monthly revenue calculations and payments
 */
export const revenueDistributions = pgTable(
  'revenue_distributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    divisionOrderId: uuid('division_order_id')
      .notNull()
      .references(() => divisionOrders.id),
    productionMonth: date('production_month').notNull(),
    oilVolume: decimal('oil_volume', { precision: 10, scale: 2 }),
    gasVolume: decimal('gas_volume', { precision: 12, scale: 2 }),
    oilRevenue: decimal('oil_revenue', { precision: 12, scale: 2 }),
    gasRevenue: decimal('gas_revenue', { precision: 12, scale: 2 }),
    totalRevenue: decimal('total_revenue', {
      precision: 12,
      scale: 2,
    }).notNull(),
    severanceTax: decimal('severance_tax', { precision: 12, scale: 2 }),
    adValorem: decimal('ad_valorem', { precision: 12, scale: 2 }),
    transportationCosts: decimal('transportation_costs', {
      precision: 12,
      scale: 2,
    }),
    processingCosts: decimal('processing_costs', { precision: 12, scale: 2 }),
    otherDeductions: decimal('other_deductions', { precision: 12, scale: 2 }),
    netRevenue: decimal('net_revenue', { precision: 12, scale: 2 }).notNull(),
    checkNumber: varchar('check_number', { length: 50 }),
    paymentDate: date('payment_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('revenue_distributions_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('revenue_distributions_well_id_idx').on(table.wellId),
    partnerIdx: index('revenue_distributions_partner_id_idx').on(
      table.partnerId,
    ),
    productionMonthIdx: index('revenue_distributions_production_month_idx').on(
      table.productionMonth,
    ),
    paymentDateIdx: index('revenue_distributions_payment_date_idx').on(
      table.paymentDate,
    ),
    // Unique constraint for partner-well-month combination
    partnerWellMonthUnique: unique(
      'revenue_distributions_partner_well_month_unique',
    ).on(table.partnerId, table.wellId, table.productionMonth),
  }),
);
