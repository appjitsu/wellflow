import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { titleOpinions } from './title-opinions';
import { documents } from './documents';

/**
 * Title Opinion Documents - Link title opinions to supporting documents
 */
export const titleOpinionDocuments = pgTable(
  'title_opinion_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titleOpinionId: uuid('title_opinion_id')
      .notNull()
      .references(() => titleOpinions.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    role: varchar('role', { length: 50 }).notNull(), // opinion|abstract|exhibit|deed|supporting
    pageRange: varchar('page_range', { length: 50 }),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniq: uniqueIndex('title_opinion_documents_unique').on(
      table.titleOpinionId,
      table.documentId,
    ),
    titleOpinionIdx: index('title_opinion_documents_title_opinion_id_idx').on(
      table.titleOpinionId,
    ),
    documentIdx: index('title_opinion_documents_document_id_idx').on(
      table.documentId,
    ),
    roleIdx: index('title_opinion_documents_role_idx').on(table.role),
  }),
);
