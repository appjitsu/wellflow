import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

// Contact type enum
export const contactTypeEnum = pgEnum('contact_type', [
  'primary',
  'billing',
  'technical',
  'safety',
  'emergency',
  'management',
  'operations',
]);

/**
 * Vendor Contacts table - Enhanced contact information for vendors
 */
export const vendorContacts = pgTable(
  'vendor_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),

    // Contact identification
    contactName: varchar('contact_name', { length: 255 }).notNull(),
    title: varchar('title', { length: 100 }),
    department: varchar('department', { length: 100 }),
    contactType: contactTypeEnum('contact_type').notNull().default('primary'),

    // Contact information
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    mobile: varchar('mobile', { length: 20 }),
    fax: varchar('fax', { length: 20 }),

    // Address (if different from vendor address)
    address: text('address'),

    // Contact preferences and availability
    preferredContactMethod: varchar('preferred_contact_method', {
      length: 20,
    }).default('email'),
    timeZone: varchar('time_zone', { length: 50 }),
    availableHours: varchar('available_hours', { length: 100 }),

    // Emergency contact information
    isEmergencyContact: boolean('is_emergency_contact')
      .default(false)
      .notNull(),
    emergencyPhone: varchar('emergency_phone', { length: 20 }),

    // Status and flags
    isPrimary: boolean('is_primary').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Additional information
    notes: text('notes'),

    // System fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index('vendor_contacts_vendor_id_idx').on(table.vendorId),
    contactTypeIdx: index('vendor_contacts_contact_type_idx').on(
      table.contactType,
    ),
    primaryIdx: index('vendor_contacts_is_primary_idx').on(table.isPrimary),
    emergencyIdx: index('vendor_contacts_is_emergency_idx').on(
      table.isEmergencyContact,
    ),
    activeIdx: index('vendor_contacts_is_active_idx').on(table.isActive),
    emailIdx: index('vendor_contacts_email_idx').on(table.email),
  }),
);
