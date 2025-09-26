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

/**
 * Permits table - Comprehensive permit lifecycle management
 * Tracks all regulatory permits for drilling, completion, workover, injection,
 * disposal, facility, pipeline, and environmental permits.
 */
export const permits = pgTable(
  'permits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    permitNumber: varchar('permit_number', { length: 100 }).notNull(),
    permitType: varchar('permit_type', { length: 50 }).notNull(), // drilling|completion|workover|injection|disposal|facility|pipeline|environmental
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|submitted|under_review|approved|denied|expired|renewed
    issuingAgency: varchar('issuing_agency', { length: 100 }).notNull(),
    regulatoryAuthority: varchar('regulatory_authority', { length: 100 }),

    // Application and approval dates
    applicationDate: date('application_date'),
    submittedDate: date('submitted_date'),
    approvalDate: date('approval_date'),
    expirationDate: date('expiration_date'),

    // Permit conditions and requirements
    permitConditions: jsonb('permit_conditions'), // JSONB for flexible condition storage
    complianceRequirements: jsonb('compliance_requirements'), // JSONB for compliance tracking

    // Financial aspects
    feeAmount: decimal('fee_amount', { precision: 12, scale: 2 }),
    bondAmount: decimal('bond_amount', { precision: 12, scale: 2 }),
    bondType: varchar('bond_type', { length: 50 }), // surety|cash|letter_of_credit

    // Location and facility information
    location: varchar('location', { length: 255 }),
    facilityId: varchar('facility_id', { length: 100 }),

    // Document management
    documentIds: jsonb('document_ids'), // Array of document IDs for permit documents

    // Audit and tracking
    createdByUserId: uuid('created_by_user_id').notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('permits_organization_id_idx').on(
      table.organizationId,
    ),
    wellIdx: index('permits_well_id_idx').on(table.wellId),
    permitNumberIdx: index('permits_permit_number_idx').on(table.permitNumber),
    permitTypeIdx: index('permits_permit_type_idx').on(table.permitType),
    statusIdx: index('permits_status_idx').on(table.status),
    issuingAgencyIdx: index('permits_issuing_agency_idx').on(
      table.issuingAgency,
    ),
    expirationDateIdx: index('permits_expiration_date_idx').on(
      table.expirationDate,
    ),
    applicationDateIdx: index('permits_application_date_idx').on(
      table.applicationDate,
    ),
  }),
);

/**
 * Permit Renewals table - Automated renewal tracking and notifications
 * Manages permit renewal lifecycle, compliance deadlines, and regulatory communication.
 */
export const permitRenewals = pgTable(
  'permit_renewals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    permitId: uuid('permit_id')
      .notNull()
      .references(() => permits.id, { onDelete: 'cascade' }),
    renewalNumber: varchar('renewal_number', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|submitted|under_review|approved|denied|expired

    // Renewal timeline
    renewalDueDate: date('renewal_due_date').notNull(),
    renewalSubmittedDate: date('renewal_submitted_date'),
    renewalApprovalDate: date('renewal_approval_date'),
    renewalExpirationDate: date('renewal_expiration_date'),

    // Fee and bond management
    renewalFeeAmount: decimal('renewal_fee_amount', {
      precision: 12,
      scale: 2,
    }),
    renewalBondAmount: decimal('renewal_bond_amount', {
      precision: 12,
      scale: 2,
    }),

    // Compliance tracking
    complianceVerifiedDate: date('compliance_verified_date'),
    conditionsMet: boolean('conditions_met').default(false),

    // Regulatory communication
    agencyContactDate: date('agency_contact_date'),
    agencyResponseDate: date('agency_response_date'),
    agencyComments: text('agency_comments'),

    // Notifications and reminders
    notificationSentDate: date('notification_sent_date'),
    reminderSentDate: date('reminder_sent_date'),
    escalationSentDate: date('escalation_sent_date'),

    // Audit and tracking
    createdByUserId: uuid('created_by_user_id').notNull(),
    updatedByUserId: uuid('updated_by_user_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    permitIdx: index('permit_renewals_permit_id_idx').on(table.permitId),
    renewalDueDateIdx: index('permit_renewals_renewal_due_date_idx').on(
      table.renewalDueDate,
    ),
    statusIdx: index('permit_renewals_status_idx').on(table.status),
  }),
);
