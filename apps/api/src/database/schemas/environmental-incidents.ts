import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { users } from './users';

/**
 * Environmental Incidents table - Environmental incident tracking and reporting
 */
export const environmentalIncidents = pgTable(
  'environmental_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    reportedByUserId: uuid('reported_by_user_id')
      .notNull()
      .references(() => users.id),
    incidentNumber: varchar('incident_number', { length: 50 }).notNull(),
    incidentType: varchar('incident_type', { length: 50 }).notNull(), // spill|leak|emission|other
    incidentDate: date('incident_date').notNull(),
    discoveryDate: date('discovery_date').notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    description: text('description').notNull(),
    causeAnalysis: text('cause_analysis'),
    substanceInvolved: varchar('substance_involved', { length: 100 }),
    estimatedVolume: decimal('estimated_volume', { precision: 10, scale: 2 }),
    volumeUnit: varchar('volume_unit', { length: 20 }), // barrels|gallons|cubic_feet
    severity: varchar('severity', { length: 10 }).notNull(), // low|medium|high|critical
    status: varchar('status', { length: 20 }).notNull().default('open'), // open|investigating|remediation|closed
    regulatoryNotification: boolean('regulatory_notification').default(false),
    notificationDate: date('notification_date'),
    remediationActions: jsonb('remediation_actions'),
    closureDate: date('closure_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('environmental_incidents_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('environmental_incidents_well_id_idx').on(table.wellId),
    incidentNumberIdx: index('environmental_incidents_incident_number_idx').on(
      table.incidentNumber,
    ),
    incidentTypeIdx: index('environmental_incidents_incident_type_idx').on(
      table.incidentType,
    ),
    severityIdx: index('environmental_incidents_severity_idx').on(
      table.severity,
    ),
    statusIdx: index('environmental_incidents_status_idx').on(table.status),
    incidentDateIdx: index('environmental_incidents_incident_date_idx').on(
      table.incidentDate,
    ),
  }),
);
