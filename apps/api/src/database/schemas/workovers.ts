import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { afes } from './afes';

/**
 * Workover Status Enum
 */
export const workoverStatusEnum = pgEnum('workover_status', [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Workovers table - Well intervention planning and execution
 */
export const workovers = pgTable(
  'workovers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant org context
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),

    // Associations
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    afeId: uuid('afe_id').references(() => afes.id),

    // Details
    reason: varchar('reason', { length: 255 }),
    status: workoverStatusEnum('status').notNull().default('planned'),
    startDate: date('start_date'),
    endDate: date('end_date'),

    workPerformed: text('work_performed'),

    // Costs
    estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),

    // Analytics: pre/post production snapshots
    preProduction: jsonb('pre_production'),
    postProduction: jsonb('post_production'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('workovers_org_idx').on(table.organizationId),
    wellIdx: index('workovers_well_idx').on(table.wellId),
    afeIdx: index('workovers_afe_idx').on(table.afeId),
    statusIdx: index('workovers_status_idx').on(table.status),
    datesIdx: index('workovers_dates_idx').on(table.startDate, table.endDate),
  }),
);
