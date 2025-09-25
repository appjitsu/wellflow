import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { curativeItems } from './curative-items';

/**
 * Curative Item Activities - Action log and workflow tracking for curative items
 */
export const curativeActivities = pgTable(
  'curative_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    curativeItemId: uuid('curative_item_id')
      .notNull()
      .references(() => curativeItems.id, { onDelete: 'cascade' }),

    actionType: varchar('action_type', { length: 50 }).notNull(), // note|assigned|status_change|doc_uploaded|email|call|filed|prepared
    actionBy: varchar('action_by', { length: 255 }),
    actionDate: timestamp('action_date').defaultNow().notNull(),
    details: text('details'),

    previousStatus: varchar('previous_status', { length: 20 }),
    newStatus: varchar('new_status', { length: 20 }),

    dueDate: date('due_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    curativeItemIdx: index('curative_activities_curative_item_id_idx').on(
      table.curativeItemId,
    ),
    actionTypeIdx: index('curative_activities_action_type_idx').on(
      table.actionType,
    ),
    actionDateIdx: index('curative_activities_action_date_idx').on(
      table.actionDate,
    ),
  }),
);
