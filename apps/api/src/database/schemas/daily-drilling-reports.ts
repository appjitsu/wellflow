import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  decimal,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';

/**
 * Daily Drilling Reports (DDR) table - Operational daily reporting during drilling
 */
export const dailyDrillingReports = pgTable(
  'daily_drilling_reports',
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

    reportDate: date('report_date').notNull(),

    // Depth tracking
    depthMd: integer('depth_md'), // measured depth (ft)
    depthTvd: integer('depth_tvd'), // true vertical depth (ft)

    // Time accounting
    rotatingHours: decimal('rotating_hours', { precision: 6, scale: 2 }),
    nptHours: decimal('npt_hours', { precision: 6, scale: 2 }),

    // Operational data payloads
    mudProperties: jsonb('mud_properties'),
    bitPerformance: jsonb('bit_performance'),
    personnel: jsonb('personnel'),
    weather: jsonb('weather'),
    hseIncidents: jsonb('hse_incidents'),

    // Costs & planning
    dayCost: decimal('day_cost', { precision: 12, scale: 2 }),
    nextOperations: text('next_operations'),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('ddr_org_idx').on(table.organizationId),
    wellIdx: index('ddr_well_idx').on(table.wellId),
    dateIdx: index('ddr_date_idx').on(table.reportDate),
    wellDateIdx: index('ddr_well_date_idx').on(table.wellId, table.reportDate),
  }),
);
