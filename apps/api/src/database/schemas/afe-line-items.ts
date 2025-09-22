/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { afes } from './afes';
import { vendors } from './vendors';

/**
 * AFE Line Items table - Detailed cost breakdown for AFEs
 */
export const afeLineItems = pgTable(
  'afe_line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    afeId: uuid('afe_id')
      .notNull()
      .references(() => afes.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(), // drilling|completion|equipment|services
    estimatedCost: decimal('estimated_cost', {
      precision: 12,
      scale: 2,
    }).notNull(),
    actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
    vendorId: uuid('vendor_id').references(() => vendors.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    afeIdx: index('afe_line_items_afe_id_idx').on(table.afeId),
    categoryIdx: index('afe_line_items_category_idx').on(table.category),
    vendorIdx: index('afe_line_items_vendor_id_idx').on(table.vendorId),
    afeLineNumberUnique: unique('afe_line_items_afe_line_unique').on(
      table.afeId,
      table.lineNumber,
    ),
  }),
);
