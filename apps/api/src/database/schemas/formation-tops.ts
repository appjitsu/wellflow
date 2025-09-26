import {
  pgTable,
  uuid,
  timestamp,
  decimal,
  varchar,
  text,
  date,
  index,
  check,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { geologicalData } from './geological-data';

/**
 * Formation Tops table - Stratigraphic formation identification
 */
export const formationTops = pgTable(
  'formation_tops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    geologicalDataId: uuid('geological_data_id').references(
      () => geologicalData.id,
    ),
    formationName: varchar('formation_name', { length: 255 }).notNull(),
    geologicalMarker: varchar('geological_marker', { length: 255 }),
    topDepth: decimal('top_depth', { precision: 10, scale: 2 }).notNull(),
    bottomDepth: decimal('bottom_depth', { precision: 10, scale: 2 }),
    pickMethod: varchar('pick_method', { length: 100 }),
    hydrocarbonShows: text('hydrocarbon_shows'),
    pickDate: date('pick_date'),
    correlationConfidence: decimal('correlation_confidence', {
      precision: 5,
      scale: 2,
    }),
    netPay: decimal('net_pay', { precision: 8, scale: 2 }),
    grossThickness: decimal('gross_thickness', { precision: 8, scale: 2 }),
    reservoirQuality: varchar('reservoir_quality', { length: 100 }),
    fluidContacts: jsonb('fluid_contacts'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('formation_tops_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('formation_tops_well_idx').on(table.wellId),
    formationIdx: index('formation_tops_formation_idx').on(table.formationName),
    depthPositiveCheck: check(
      'formation_tops_depth_positive_check',
      sql`top_depth >= 0 AND (bottom_depth IS NULL OR bottom_depth >= 0)`,
    ),
    depthOrderingCheck: check(
      'formation_tops_depth_ordering_check',
      sql`bottom_depth IS NULL OR top_depth <= bottom_depth`,
    ),
    correlationRangeCheck: check(
      'formation_tops_correlation_range_check',
      sql`correlation_confidence IS NULL OR (correlation_confidence >= 0 AND correlation_confidence <= 100)`,
    ),
  }),
);
