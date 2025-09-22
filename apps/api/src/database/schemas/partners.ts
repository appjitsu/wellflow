/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Partners table - Joint venture partners and royalty owners
 */
export const partners = pgTable(
  'partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    partnerName: varchar('partner_name', { length: 255 }).notNull(),
    partnerCode: varchar('partner_code', { length: 50 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    billingAddress: jsonb('billing_address'),
    remitAddress: jsonb('remit_address'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationPartnerCodeIdx: unique('partners_org_partner_code_unique').on(
      table.organizationId,
      table.partnerCode,
    ),
    organizationIdx: index('partners_organization_id_idx').on(
      table.organizationId,
    ),
    activeIdx: index('partners_is_active_idx').on(table.isActive),
  }),
);
