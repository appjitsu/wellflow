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
 * HSE Incidents table - Comprehensive incident tracking and management
 * Tracks health, safety, and environmental incidents with severity classification,
 * root cause analysis, and corrective action tracking.
 */
export const hseIncidents = pgTable(
  'hse_incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),

    // Incident identification
    incidentNumber: varchar('incident_number', { length: 50 }).notNull(),

    incidentType: varchar('incident_type', { length: 50 }).notNull(), // spill|release|injury|fatality|near_miss|equipment_failure|well_control|fire|explosion
    severity: varchar('severity', { length: 10 }).notNull(), // low|medium|high|critical

    // Incident details
    incidentDate: timestamp('incident_date').notNull(),
    discoveryDate: timestamp('discovery_date'),
    location: varchar('location', { length: 255 }).notNull(),
    facilityId: varchar('facility_id', { length: 100 }),
    description: text('description').notNull(),

    // Personnel involved
    reportedByUserId: uuid('reported_by_user_id')
      .notNull()
      .references(() => users.id),
    affectedPersonnel: jsonb('affected_personnel'), // Array of personnel details with roles and injuries

    // Root cause and analysis
    rootCauseAnalysis: jsonb('root_cause_analysis'), // Structured root cause analysis data
    contributingFactors: jsonb('contributing_factors'), // Contributing factors and conditions

    // Impact assessment
    environmentalImpact: jsonb('environmental_impact'), // Environmental impact assessment
    propertyDamage: decimal('property_damage', { precision: 12, scale: 2 }),
    estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),

    // Regulatory requirements
    reportableAgencies: jsonb('reportable_agencies'), // Array of agencies that need to be notified
    regulatoryNotificationRequired: boolean(
      'regulatory_notification_required',
    ).default(false),
    notificationDeadline: date('notification_deadline'),

    // Investigation and response
    investigationStatus: varchar('investigation_status', { length: 20 })
      .notNull()
      .default('open'), // open|investigating|completed|closed
    investigationLeadUserId: uuid('investigation_lead_user_id').references(
      () => users.id,
    ),
    investigationStartDate: date('investigation_start_date'),
    investigationCompletionDate: date('investigation_completion_date'),

    // Corrective actions (will be linked to incident_responses table)
    correctiveActions: jsonb('corrective_actions'), // Immediate corrective actions taken

    // Status and closure
    status: varchar('status', { length: 20 }).notNull().default('open'), // open|investigating|remediation|closed
    closureDate: date('closure_date'),
    lessonsLearned: text('lessons_learned'),

    // Audit and tracking
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('hse_incidents_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('hse_incidents_well_id_idx').on(table.wellId),
    incidentNumberIdx: index('hse_incidents_incident_number_idx').on(
      table.incidentNumber,
    ),
    incidentTypeIdx: index('hse_incidents_incident_type_idx').on(
      table.incidentType,
    ),
    severityIdx: index('hse_incidents_severity_idx').on(table.severity),
    statusIdx: index('hse_incidents_status_idx').on(table.status),
    investigationStatusIdx: index('hse_incidents_investigation_status_idx').on(
      table.investigationStatus,
    ),
    incidentDateIdx: index('hse_incidents_incident_date_idx').on(
      table.incidentDate,
    ),
    notificationDeadlineIdx: index(
      'hse_incidents_notification_deadline_idx',
    ).on(table.notificationDeadline),
  }),
);

/**
 * Incident Responses table - Emergency response procedures and timelines
 * Tracks detailed response actions, regulatory notifications, corrective actions,
 * and investigation workflows for HSE incidents.
 */
export const incidentResponses = pgTable(
  'incident_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => hseIncidents.id, { onDelete: 'cascade' }),

    // Response classification
    responseType: varchar('response_type', { length: 50 }).notNull(), // emergency|investigation|remediation|notification|closure

    // Timeline tracking
    initiatedDate: timestamp('initiated_date').notNull(),
    completedDate: timestamp('completed_date'),
    dueDate: timestamp('due_date'),

    // Personnel and resources
    assignedUserId: uuid('assigned_user_id')
      .notNull()
      .references(() => users.id),
    teamMembers: jsonb('team_members'), // Array of team member IDs and roles
    resourcesUtilized: jsonb('resources_utilized'), // Equipment, materials, external services

    // Response details
    description: text('description').notNull(),
    proceduresFollowed: jsonb('procedures_followed'), // Standard operating procedures referenced
    actionsTaken: jsonb('actions_taken'), // Detailed actions with timestamps and outcomes

    // For emergency responses
    emergencyProcedures: jsonb('emergency_procedures'), // Emergency response procedures executed
    containmentAchieved: boolean('containment_achieved'),
    containmentDate: timestamp('containment_date'),

    // For regulatory notifications
    agencyNotified: varchar('agency_notified', { length: 100 }),
    notificationMethod: varchar('notification_method', { length: 50 }), // phone|email|fax|portal
    reportNumber: varchar('report_number', { length: 100 }),
    notificationDate: timestamp('notification_date'),
    agencyResponse: text('agency_response'),

    // For corrective actions
    correctiveActionType: varchar('corrective_action_type', { length: 50 }), // preventive|corrective|mitigation
    effectivenessRating: varchar('effectiveness_rating', { length: 10 }), // poor|fair|good|excellent
    verificationMethod: varchar('verification_method', { length: 100 }),

    // Status and approval
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|in_progress|completed|cancelled
    approvalRequired: boolean('approval_required').default(false),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
    approvalDate: timestamp('approval_date'),

    // Follow-up and lessons learned
    followUpRequired: boolean('follow_up_required').default(false),
    followUpDate: date('follow_up_date'),
    lessonsLearned: text('lessons_learned'),
    preventiveMeasures: jsonb('preventive_measures'), // Future prevention recommendations

    // Cost tracking
    costIncurred: decimal('cost_incurred', { precision: 12, scale: 2 }),
    costCategory: varchar('cost_category', { length: 50 }), // labor|equipment|cleanup|legal|other

    // Audit and tracking
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    incidentIdx: index('incident_responses_incident_id_idx').on(
      table.incidentId,
    ),
    responseTypeIdx: index('incident_responses_response_type_idx').on(
      table.responseType,
    ),
    assignedUserIdx: index('incident_responses_assigned_user_id_idx').on(
      table.assignedUserId,
    ),
    statusIdx: index('incident_responses_status_idx').on(table.status),
    dueDateIdx: index('incident_responses_due_date_idx').on(table.dueDate),
    notificationDateIdx: index('incident_responses_notification_date_idx').on(
      table.notificationDate,
    ),
  }),
);
