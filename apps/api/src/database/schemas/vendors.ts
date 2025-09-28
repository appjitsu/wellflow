import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  index,
  unique,
  decimal,
  integer,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

// Vendor-related enums
export const vendorStatusEnum = pgEnum('vendor_status', [
  'pending',
  'approved',
  'rejected',
  'suspended',
  'inactive',
]);

export const vendorTypeEnum = pgEnum('vendor_type', [
  'service',
  'supplier',
  'contractor',
  'consultant',
  'transportation',
  'maintenance',
  'environmental',
  'laboratory',
]);

export const vendorRatingEnum = pgEnum('vendor_rating', [
  'not_rated',
  'excellent',
  'good',
  'satisfactory',
  'poor',
  'unacceptable',
]);

/**
 * Vendors table - Service providers and suppliers with comprehensive management
 */
export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    vendorName: varchar('vendor_name', { length: 255 }).notNull(),
    vendorCode: varchar('vendor_code', { length: 50 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    vendorType: vendorTypeEnum('vendor_type').notNull(),
    status: vendorStatusEnum('status').notNull().default('pending'),

    // Address information
    billingAddress: jsonb('billing_address'),
    serviceAddress: jsonb('service_address'),

    // Financial information
    paymentTerms: varchar('payment_terms', { length: 50 }),
    creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }),

    // Insurance information
    insurance: jsonb('insurance'), // Stores insurance policies and coverage

    // Certifications and qualifications
    certifications: jsonb('certifications'), // Array of certifications
    isPrequalified: boolean('is_prequalified').default(false).notNull(),
    prequalificationDate: timestamp('prequalification_date'),
    qualificationExpiryDate: timestamp('qualification_expiry_date'),

    // Performance metrics
    overallRating: vendorRatingEnum('overall_rating')
      .default('not_rated')
      .notNull(),
    safetyRating: vendorRatingEnum('safety_rating')
      .default('not_rated')
      .notNull(),
    qualityRating: vendorRatingEnum('quality_rating')
      .default('not_rated')
      .notNull(),
    timelinessRating: vendorRatingEnum('timeliness_rating')
      .default('not_rated')
      .notNull(),
    costEffectivenessRating: vendorRatingEnum('cost_effectiveness_rating')
      .default('not_rated')
      .notNull(),

    // Performance statistics
    totalJobsCompleted: integer('total_jobs_completed').default(0).notNull(),
    averageJobValue: decimal('average_job_value', { precision: 12, scale: 2 })
      .default('0')
      .notNull(),
    incidentCount: integer('incident_count').default(0).notNull(),
    lastEvaluationDate: timestamp('last_evaluation_date'),

    // Service categories and capabilities
    serviceCategories: jsonb('service_categories'), // Array of service categories
    capabilities: text('capabilities'), // Detailed capabilities description

    // Contact and administrative
    primaryContactId: uuid('primary_contact_id'), // References vendor_contacts
    website: varchar('website', { length: 255 }),
    notes: text('notes'),

    // System fields
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    version: integer('version').default(1).notNull(),
  },
  (table) => ({
    organizationIdx: index('vendors_organization_id_idx').on(
      table.organizationId,
    ),
    vendorTypeIdx: index('vendors_vendor_type_idx').on(table.vendorType),
    statusIdx: index('vendors_status_idx').on(table.status),
    activeIdx: index('vendors_is_active_idx').on(table.isActive),
    prequalifiedIdx: index('vendors_is_prequalified_idx').on(
      table.isPrequalified,
    ),
    overallRatingIdx: index('vendors_overall_rating_idx').on(
      table.overallRating,
    ),

    qualificationExpiryIdx: index('vendors_qualification_expiry_idx').on(
      table.qualificationExpiryDate,
    ),
    lastEvaluationIdx: index('vendors_last_evaluation_idx').on(
      table.lastEvaluationDate,
    ),
    orgVendorCodeUnique: unique('vendors_org_vendor_code_unique').on(
      table.organizationId,
      table.vendorCode,
    ),
  }),
);
