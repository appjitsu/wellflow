/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { leases } from './leases';
import { wells } from './wells';

/**
 * Documents table - Centralized document storage and management
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    uploadedByUserId: uuid('uploaded_by_user_id')
      .notNull()
      .references(() => users.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    wellId: uuid('well_id').references(() => wells.id),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(), // lease|permit|contract|report|other
    filePath: varchar('file_path', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),
    metadata: jsonb('metadata'),
    expirationDate: date('expiration_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('documents_organization_id_idx').on(
      table.organizationId,
    ),
    uploadedByIdx: index('documents_uploaded_by_idx').on(
      table.uploadedByUserId,
    ),
    leaseIdx: index('documents_lease_id_idx').on(table.leaseId),
    wellIdx: index('documents_well_id_idx').on(table.wellId),
    documentTypeIdx: index('documents_document_type_idx').on(
      table.documentType,
    ),
    expirationIdx: index('documents_expiration_date_idx').on(
      table.expirationDate,
    ),
  }),
);
