/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  date,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { partners } from './partners';

/**
 * Division Orders table - Owner decimal interests and revenue distribution
 */
export const divisionOrders = pgTable(
  'division_orders',
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
    decimalInterest: decimal('decimal_interest', {
      precision: 10,
      scale: 8,
    }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('division_orders_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('division_orders_well_id_idx').on(table.wellId),
    partnerIdx: index('division_orders_partner_id_idx').on(table.partnerId),
    effectiveDateIdx: index('division_orders_effective_date_idx').on(
      table.effectiveDate,
    ),
    wellPartnerUnique: unique('division_orders_well_partner_unique').on(
      table.wellId,
      table.partnerId,
      table.effectiveDate,
    ),
  }),
);
