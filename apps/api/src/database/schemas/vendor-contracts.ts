import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  index,
  decimal,
  integer,
  text,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';
import { vendors } from './vendors';
import { organizations } from './organizations';

// Contract-related enums
export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'pending_approval',
  'active',
  'expired',
  'terminated',
  'suspended',
]);

export const contractTypeEnum = pgEnum('contract_type', [
  'service_agreement',
  'master_service_agreement',
  'purchase_order',
  'blanket_order',
  'frame_agreement',
  'consulting_agreement',
]);

/**
 * Vendor Contracts table - Service contracts and agreements
 */
export const vendorContracts = pgTable(
  'vendor_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),

    // Contract identification
    contractNumber: varchar('contract_number', { length: 100 }).notNull(),
    contractType: contractTypeEnum('contract_type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Contract status and dates
    status: contractStatusEnum('status').notNull().default('draft'),
    effectiveDate: date('effective_date').notNull(),
    expirationDate: date('expiration_date').notNull(),
    signedDate: date('signed_date'),

    // Financial terms
    contractValue: decimal('contract_value', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    paymentTerms: varchar('payment_terms', { length: 100 }),

    // Rate schedules and pricing
    rateSchedule: jsonb('rate_schedule'), // Structured pricing information

    // Performance requirements
    serviceLevel: jsonb('service_level'), // SLA requirements
    performanceMetrics: jsonb('performance_metrics'), // KPIs and targets

    // Insurance and compliance requirements
    insuranceRequirements: jsonb('insurance_requirements'),
    complianceRequirements: jsonb('compliance_requirements'),

    // Contract terms
    terminationClause: text('termination_clause'),
    renewalTerms: jsonb('renewal_terms'),
    penaltyClause: text('penalty_clause'),

    // Approval workflow
    approvedBy: uuid('approved_by'), // User ID who approved
    approvalDate: timestamp('approval_date'),
    approvalNotes: text('approval_notes'),

    // Document management
    documentPath: varchar('document_path', { length: 500 }), // Path to contract document
    attachments: jsonb('attachments'), // Array of attachment references

    // Performance tracking
    performanceScore: decimal('performance_score', { precision: 3, scale: 2 }), // 0.00 to 5.00
    lastPerformanceReview: timestamp('last_performance_review'),

    // Renewal tracking
    autoRenewal: boolean('auto_renewal').default(false).notNull(),
    renewalNoticeDate: date('renewal_notice_date'),
    renewalNoticeSent: boolean('renewal_notice_sent').default(false).notNull(),

    // System fields
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    version: integer('version').default(1).notNull(),
  },
  (table) => ({
    organizationIdx: index('vendor_contracts_organization_id_idx').on(
      table.organizationId,
    ),
    vendorIdx: index('vendor_contracts_vendor_id_idx').on(table.vendorId),
    statusIdx: index('vendor_contracts_status_idx').on(table.status),
    contractTypeIdx: index('vendor_contracts_contract_type_idx').on(
      table.contractType,
    ),
    effectiveDateIdx: index('vendor_contracts_effective_date_idx').on(
      table.effectiveDate,
    ),
    expirationDateIdx: index('vendor_contracts_expiration_date_idx').on(
      table.expirationDate,
    ),
    renewalNoticeDateIdx: index('vendor_contracts_renewal_notice_date_idx').on(
      table.renewalNoticeDate,
    ),
    activeIdx: index('vendor_contracts_is_active_idx').on(table.isActive),
  }),
);

/**
 * Vendor Performance Reviews table - Track vendor performance evaluations
 */
export const vendorPerformanceReviews = pgTable(
  'vendor_performance_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    contractId: uuid('contract_id').references(() => vendorContracts.id, {
      onDelete: 'set null',
    }),

    // Review identification
    reviewPeriodStart: date('review_period_start').notNull(),
    reviewPeriodEnd: date('review_period_end').notNull(),
    reviewDate: timestamp('review_date').notNull(),

    // Reviewer information
    reviewedBy: uuid('reviewed_by').notNull(), // User ID
    reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
    reviewerTitle: varchar('reviewer_title', { length: 100 }),

    // Performance ratings (1-5 scale)
    overallRating: decimal('overall_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),
    safetyRating: decimal('safety_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),
    qualityRating: decimal('quality_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),
    timelinessRating: decimal('timeliness_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),
    costEffectivenessRating: decimal('cost_effectiveness_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),
    communicationRating: decimal('communication_rating', {
      precision: 2,
      scale: 1,
    }).notNull(),

    // Performance metrics
    jobsCompleted: integer('jobs_completed').default(0).notNull(),
    jobsOnTime: integer('jobs_on_time').default(0).notNull(),
    safetyIncidents: integer('safety_incidents').default(0).notNull(),
    qualityIssues: integer('quality_issues').default(0).notNull(),
    costVariance: decimal('cost_variance', { precision: 5, scale: 2 }), // Percentage

    // Detailed feedback
    strengths: text('strengths'),
    areasForImprovement: text('areas_for_improvement'),
    specificFeedback: text('specific_feedback'),
    recommendedActions: text('recommended_actions'),

    // Recommendation
    recommendForRenewal: boolean('recommend_for_renewal').notNull(),
    recommendationNotes: text('recommendation_notes'),

    // System fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('vendor_performance_reviews_organization_id_idx').on(
      table.organizationId,
    ),
    vendorIdx: index('vendor_performance_reviews_vendor_id_idx').on(
      table.vendorId,
    ),
    contractIdx: index('vendor_performance_reviews_contract_id_idx').on(
      table.contractId,
    ),
    reviewDateIdx: index('vendor_performance_reviews_review_date_idx').on(
      table.reviewDate,
    ),
    reviewPeriodIdx: index('vendor_performance_reviews_period_idx').on(
      table.reviewPeriodStart,
      table.reviewPeriodEnd,
    ),
    overallRatingIdx: index('vendor_performance_reviews_overall_rating_idx').on(
      table.overallRating,
    ),
  }),
);

/**
 * Vendor Qualifications table - Track certifications, licenses, and qualifications
 */
export const vendorQualifications = pgTable(
  'vendor_qualifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),

    // Qualification details
    qualificationType: varchar('qualification_type', { length: 100 }).notNull(), // certification, license, etc.
    qualificationName: varchar('qualification_name', { length: 255 }).notNull(),
    issuingBody: varchar('issuing_body', { length: 255 }).notNull(),
    qualificationNumber: varchar('qualification_number', { length: 100 }),

    // Dates
    issueDate: date('issue_date').notNull(),
    expirationDate: date('expiration_date'),
    lastVerifiedDate: date('last_verified_date'),

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),

    // Documentation
    documentPath: varchar('document_path', { length: 500 }),
    verificationNotes: text('verification_notes'),

    // System fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index('vendor_qualifications_vendor_id_idx').on(table.vendorId),

    qualificationTypeIdx: index('vendor_qualifications_type_idx').on(
      table.qualificationType,
    ),
    expirationDateIdx: index('vendor_qualifications_expiration_date_idx').on(
      table.expirationDate,
    ),
    activeIdx: index('vendor_qualifications_is_active_idx').on(table.isActive),
    verifiedIdx: index('vendor_qualifications_is_verified_idx').on(
      table.isVerified,
    ),
  }),
);
