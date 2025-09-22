/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { titleOpinions } from './title-opinions';

/**
 * Curative Items table - Title defects requiring resolution
 */
export const curativeItems = pgTable(
  'curative_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titleOpinionId: uuid('title_opinion_id')
      .notNull()
      .references(() => titleOpinions.id, { onDelete: 'cascade' }),
    itemNumber: varchar('item_number', { length: 20 }).notNull(),
    defectType: varchar('defect_type', { length: 50 }).notNull(), // missing_deed|gap_in_chain|probate|other
    description: text('description').notNull(),
    priority: varchar('priority', { length: 10 }).notNull(), // high|medium|low
    status: varchar('status', { length: 20 }).notNull().default('open'), // open|in_progress|resolved|waived
    assignedTo: varchar('assigned_to', { length: 255 }),
    dueDate: date('due_date'),
    resolutionDate: date('resolution_date'),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    titleOpinionIdx: index('curative_items_title_opinion_id_idx').on(
      table.titleOpinionId,
    ),
    defectTypeIdx: index('curative_items_defect_type_idx').on(table.defectType),
    priorityIdx: index('curative_items_priority_idx').on(table.priority),
    statusIdx: index('curative_items_status_idx').on(table.status),
    dueDateIdx: index('curative_items_due_date_idx').on(table.dueDate),
  }),
);
