import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { leases } from './leases';

/**
 * Chain of Title Entries - Chronological ownership and encumbrance history
 */
export const chainOfTitleEntries = pgTable(
  'chain_of_title_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),

    instrumentType: varchar('instrument_type', { length: 50 }).notNull(), // deed|assignment|probate|affidavit|release|mortgage|other
    instrumentDate: date('instrument_date').notNull(),

    // Recording information (county clerk/book/page/doc number)
    recordingInfo: jsonb('recording_info'), // { county, state, volume, page, docNumber }

    grantor: text('grantor').notNull(),
    grantee: text('grantee').notNull(),

    legalDescriptionRef: varchar('legal_description_ref', { length: 255 }),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('chain_of_title_organization_id_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('chain_of_title_lease_id_idx').on(table.leaseId),
    instrumentTypeIdx: index('chain_of_title_instrument_type_idx').on(
      table.instrumentType,
    ),
    instrumentDateIdx: index('chain_of_title_instrument_date_idx').on(
      table.instrumentDate,
    ),
  }),
);
