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
 * Vendors table - Service providers and suppliers
 */
export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    vendorCode: varchar('vendor_code', { length: 50 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    vendorType: varchar('vendor_type', { length: 50 }).notNull(), // service|supplier|contractor
    billingAddress: jsonb('billing_address'),
    paymentTerms: varchar('payment_terms', { length: 50 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('vendors_organization_id_idx').on(
      table.organizationId,
    ),
    vendorTypeIdx: index('vendors_vendor_type_idx').on(table.vendorType),
    activeIdx: index('vendors_is_active_idx').on(table.isActive),
    orgVendorCodeUnique: unique('vendors_org_vendor_code_unique').on(
      table.organizationId,
      table.vendorCode,
    ),
  }),
);
