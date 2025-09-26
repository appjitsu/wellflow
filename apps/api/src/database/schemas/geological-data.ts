import {
  pgTable,
  uuid,
  timestamp,
  text,
  jsonb,
  integer,
  varchar,
  date,
  index,
  pgEnum,
  check,
  decimal,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { wells } from './wells';
import { users } from './users';

export const geologicalInterpretationStatusEnum = pgEnum(
  'geological_interpretation_status',
  ['DRAFT', 'IN_PROGRESS', 'APPROVED', 'ARCHIVED'],
);

export const geologicalDataSourceEnum = pgEnum('geological_data_source', [
  'LOGGING',
  'CORE',
  'SEISMIC',
  'PRESSURE',
  'OTHER',
]);

export const geologicalLogTypeEnum = pgEnum('geological_log_type', [
  'GAMMA_RAY',
  'RESISTIVITY',
  'NEUTRON',
  'DENSITY',
  'SONIC',
  'IMAGING',
  'OTHER',
]);

/**
 * Geological Data table - Version-controlled geological interpretations
 */
export const geologicalData = pgTable(
  'geological_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    version: integer('version').notNull().default(1),
    status: geologicalInterpretationStatusEnum('status')
      .notNull()
      .default('DRAFT'),
    dataSource: geologicalDataSourceEnum('data_source')
      .notNull()
      .default('LOGGING'),
    logType: geologicalLogTypeEnum('log_type'),
    formation: varchar('formation', { length: 255 }),
    geologicalMarker: varchar('geological_marker', { length: 255 }),
    topMeasuredDepth: decimal('top_measured_depth', {
      precision: 10,
      scale: 2,
    }),
    topTrueVerticalDepth: decimal('top_true_vertical_depth', {
      precision: 10,
      scale: 2,
    }),
    baseMeasuredDepth: decimal('base_measured_depth', {
      precision: 10,
      scale: 2,
    }),
    baseTrueVerticalDepth: decimal('base_true_vertical_depth', {
      precision: 10,
      scale: 2,
    }),
    netPay: decimal('net_pay', { precision: 8, scale: 2 }),
    porosityPercent: decimal('porosity_percent', { precision: 5, scale: 2 }),
    permeabilityMillidarcies: decimal('permeability_millidarcies', {
      precision: 10,
      scale: 3,
    }),
    waterSaturationPercent: decimal('water_saturation_percent', {
      precision: 5,
      scale: 2,
    }),
    hydrocarbonShows: text('hydrocarbon_shows'),
    reservoirQuality: varchar('reservoir_quality', { length: 100 }),
    pressureGradient: decimal('pressure_gradient', { precision: 8, scale: 3 }),
    temperatureGradient: decimal('temperature_gradient', {
      precision: 8,
      scale: 3,
    }),
    interpretationDate: date('interpretation_date'),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    interpretedByUserId: uuid('interpreted_by_user_id').references(
      () => users.id,
    ),
    summary: text('summary'),
    logData: jsonb('log_data'),
    coreAnalysis: jsonb('core_analysis'),
    structuralModel: jsonb('structural_model'),
    reservoirProperties: jsonb('reservoir_properties'),
    attachments: jsonb('attachments'),
    changeComment: text('change_comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('geological_data_organization_idx').on(
      table.organizationId,
    ),
    wellIdx: index('geological_data_well_idx').on(table.wellId),
    versionIdx: index('geological_data_version_idx').on(
      table.wellId,
      table.version,
    ),
    versionPositiveCheck: check(
      'geological_data_version_positive_check',
      sql`version > 0`,
    ),
    depthOrderingCheck: check(
      'geological_data_depth_ordering_check',
      sql`
        (top_measured_depth IS NULL OR base_measured_depth IS NULL OR top_measured_depth <= base_measured_depth)
        AND (top_true_vertical_depth IS NULL OR base_true_vertical_depth IS NULL OR top_true_vertical_depth <= base_true_vertical_depth)
      `,
    ),
    porosityRangeCheck: check(
      'geological_data_porosity_range_check',
      sql`porosity_percent IS NULL OR (porosity_percent >= 0 AND porosity_percent <= 100)`,
    ),
    saturationRangeCheck: check(
      'geological_data_saturation_range_check',
      sql`water_saturation_percent IS NULL OR (water_saturation_percent >= 0 AND water_saturation_percent <= 100)`,
    ),
  }),
);
