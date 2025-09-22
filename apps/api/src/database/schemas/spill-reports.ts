/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { environmentalIncidents } from './environmental-incidents';

/**
 * Spill Reports table - Detailed spill reporting for regulatory compliance
 */
export const spillReports = pgTable(
  'spill_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    environmentalIncidentId: uuid('environmental_incident_id')
      .notNull()
      .references(() => environmentalIncidents.id, { onDelete: 'cascade' }),
    reportNumber: varchar('report_number', { length: 50 }).notNull(),
    regulatoryAgency: varchar('regulatory_agency', { length: 100 }).notNull(), // RRC|EPA|TCEQ
    reportType: varchar('report_type', { length: 50 }).notNull(), // initial|follow_up|final
    submissionDate: date('submission_date').notNull(),
    spillVolume: decimal('spill_volume', { precision: 10, scale: 2 }).notNull(),
    recoveredVolume: decimal('recovered_volume', { precision: 10, scale: 2 }),
    affectedArea: decimal('affected_area', { precision: 10, scale: 2 }), // square feet
    soilContamination: varchar('soil_contamination', { length: 20 }), // none|minor|moderate|severe
    groundwaterImpact: varchar('groundwater_impact', { length: 20 }), // none|potential|confirmed
    wildlifeImpact: varchar('wildlife_impact', { length: 20 }), // none|minor|significant
    cleanupActions: jsonb('cleanup_actions'),
    finalDisposition: text('final_disposition'),
    reportStatus: varchar('report_status', { length: 20 })
      .notNull()
      .default('draft'), // draft|submitted|approved|closed
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    environmentalIncidentIdx: index(
      'spill_reports_environmental_incident_id_idx',
    ).on(table.environmentalIncidentId),
    reportNumberIdx: index('spill_reports_report_number_idx').on(
      table.reportNumber,
    ),
    regulatoryAgencyIdx: index('spill_reports_regulatory_agency_idx').on(
      table.regulatoryAgency,
    ),
    reportTypeIdx: index('spill_reports_report_type_idx').on(table.reportType),
    reportStatusIdx: index('spill_reports_report_status_idx').on(
      table.reportStatus,
    ),
    submissionDateIdx: index('spill_reports_submission_date_idx').on(
      table.submissionDate,
    ),
  }),
);
