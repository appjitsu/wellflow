import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { curativeItems } from './curative-items';
import { documents } from './documents';

/**
 * Curative Item Documents - Link curative items to supporting documents
 */
export const curativeItemDocuments = pgTable(
  'curative_item_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    curativeItemId: uuid('curative_item_id')
      .notNull()
      .references(() => curativeItems.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    role: varchar('role', { length: 50 }).notNull(), // resolution|evidence|supporting|reference
    pageRange: varchar('page_range', { length: 50 }),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniq: uniqueIndex('curative_item_documents_unique').on(
      table.curativeItemId,
      table.documentId,
    ),
    curativeItemIdx: index('curative_item_documents_curative_item_id_idx').on(
      table.curativeItemId,
    ),
    documentIdx: index('curative_item_documents_document_id_idx').on(
      table.documentId,
    ),
    roleIdx: index('curative_item_documents_role_idx').on(table.role),
  }),
);
