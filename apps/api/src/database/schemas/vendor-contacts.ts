import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

/**
 * Vendor Contacts table - Contact information for vendors
 */
export const vendorContacts = pgTable(
  'vendor_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    contactName: varchar('contact_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 100 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    mobile: varchar('mobile', { length: 20 }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index('vendor_contacts_vendor_id_idx').on(table.vendorId),
    primaryIdx: index('vendor_contacts_is_primary_idx').on(table.isPrimary),
    emailIdx: index('vendor_contacts_email_idx').on(table.email),
  }),
);
