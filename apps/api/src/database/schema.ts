/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// CORE BUSINESS ENTITIES
// =============================================================================

/**
 * Organizations table - Multi-tenant root entity
 * Represents oil & gas operator companies
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 50 }),
  address: jsonb('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  settings: jsonb('settings').default('{}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Users table - System users with role-based access control
 * Roles: owner, manager, pumper
 */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(), // owner|manager|pumper
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: unique('users_email_unique').on(table.email),
    organizationIdx: index('users_organization_id_idx').on(
      table.organizationId,
    ),
    roleIdx: index('users_role_idx').on(table.role),
  }),
);

/**
 * Leases table - Legal agreements for oil & gas extraction rights
 */
export const leases = pgTable(
  'leases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseName: varchar('lease_name', { length: 255 }).notNull(),
    leaseNumber: varchar('lease_number', { length: 100 }),
    legalDescription: jsonb('legal_description'),
    surfaceLocation: jsonb('surface_location'),
    leaseStartDate: date('lease_start_date'),
    leaseEndDate: date('lease_end_date'),
    totalAcres: decimal('total_acres', { precision: 10, scale: 4 }),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active|expired|terminated
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationLeaseNameIdx: unique('leases_org_lease_name_unique').on(
      table.organizationId,
      table.leaseName,
    ),
    organizationIdx: index('leases_organization_id_idx').on(
      table.organizationId,
    ),
    statusIdx: index('leases_status_idx').on(table.status),
    endDateIdx: index('leases_end_date_idx').on(table.leaseEndDate),
  }),
);

/**
 * Wells table - Individual wellbores for oil & gas production
 */
export const wells = pgTable(
  'wells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    wellName: varchar('well_name', { length: 255 }).notNull(),
    apiNumber: varchar('api_number', { length: 14 }).notNull(), // 14-digit API number
    surfaceLocation: jsonb('surface_location'),
    bottomHoleLocation: jsonb('bottom_hole_location'),
    totalDepth: decimal('total_depth', { precision: 8, scale: 2 }),
    spudDate: date('spud_date'),
    completionDate: date('completion_date'),
    status: varchar('status', { length: 20 }).notNull().default('drilling'), // drilling|producing|shut_in|plugged
    wellConfiguration: jsonb('well_configuration'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    apiNumberIdx: unique('wells_api_number_unique').on(table.apiNumber),
    organizationIdx: index('wells_organization_id_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('wells_lease_id_idx').on(table.leaseId),
    statusIdx: index('wells_status_idx').on(table.status),
    // API number validation constraint - 14 digits only (will be added via migration)
    // apiNumberCheck: check(
    //   'wells_api_number_check',
    //   `LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$'`,
    // ),
  }),
);

/**
 * Production Records table - Daily production data entry and tracking
 * Optimized for TimescaleDB hypertable conversion
 */
export const productionRecords = pgTable(
  'production_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    productionDate: date('production_date').notNull(),
    oilVolume: decimal('oil_volume', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    gasVolume: decimal('gas_volume', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    waterVolume: decimal('water_volume', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    oilPrice: decimal('oil_price', { precision: 8, scale: 4 }),
    gasPrice: decimal('gas_price', { precision: 8, scale: 4 }),
    equipmentReadings: jsonb('equipment_readings'),
    notes: text('notes'),
    isEstimated: boolean('is_estimated').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wellDateIdx: unique('production_records_well_date_unique').on(
      table.wellId,
      table.productionDate,
    ),
    wellIdx: index('production_records_well_id_idx').on(table.wellId),
    dateIdx: index('production_records_date_idx').on(table.productionDate),
    createdByIdx: index('production_records_created_by_idx').on(
      table.createdByUserId,
    ),
    // Volume validation constraints - must be non-negative (will be added via migration)
    // volumeCheck: check(
    //   'production_records_volume_check',
    //   `oil_volume >= 0 AND gas_volume >= 0 AND water_volume >= 0`,
    // ),
  }),
);

// =============================================================================
// PARTNER & FINANCIAL ENTITIES
// =============================================================================

/**
 * Partners table - Joint venture partners and royalty owners
 */
export const partners = pgTable(
  'partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    partnerName: varchar('partner_name', { length: 255 }).notNull(),
    partnerCode: varchar('partner_code', { length: 50 }).notNull(),
    taxId: varchar('tax_id', { length: 50 }),
    billingAddress: jsonb('billing_address'),
    remitAddress: jsonb('remit_address'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationPartnerCodeIdx: unique('partners_org_partner_code_unique').on(
      table.organizationId,
      table.partnerCode,
    ),
    organizationIdx: index('partners_organization_id_idx').on(
      table.organizationId,
    ),
    activeIdx: index('partners_is_active_idx').on(table.isActive),
  }),
);

/**
 * Lease Partners table - Ownership interests in specific leases
 * Many-to-many relationship between leases and partners
 */
export const leasePartners = pgTable(
  'lease_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    workingInterestPercent: decimal('working_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    royaltyInterestPercent: decimal('royalty_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    netRevenueInterestPercent: decimal('net_revenue_interest_percent', {
      precision: 5,
      scale: 4,
    }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),
    isOperator: boolean('is_operator').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    leasePartnerIdx: index('lease_partners_lease_partner_idx').on(
      table.leaseId,
      table.partnerId,
    ),
    leaseIdx: index('lease_partners_lease_id_idx').on(table.leaseId),
    partnerIdx: index('lease_partners_partner_id_idx').on(table.partnerId),
    effectiveDateIdx: index('lease_partners_effective_date_idx').on(
      table.effectiveDate,
    ),
    // Percentage validation constraints - must be between 0 and 100 (will be added via migration)
    // percentageCheck: check(
    //   'lease_partners_percentage_check',
    //   `working_interest_percent >= 0 AND working_interest_percent <= 100 AND
    //    royalty_interest_percent >= 0 AND royalty_interest_percent <= 100 AND
    //    net_revenue_interest_percent >= 0 AND net_revenue_interest_percent <= 100`,
    // ),
  }),
);

// =============================================================================
// COMPLIANCE & REPORTING ENTITIES
// =============================================================================

/**
 * Compliance Reports table - Regulatory reporting and submissions
 */
export const complianceReports = pgTable(
  'compliance_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    reportType: varchar('report_type', { length: 50 }).notNull(), // form_pr|severance_tax|royalty_report
    stateJurisdiction: varchar('state_jurisdiction', { length: 10 }).notNull(),
    reportingPeriodStart: date('reporting_period_start').notNull(),
    reportingPeriodEnd: date('reporting_period_end').notNull(),
    dueDate: date('due_date').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|submitted|approved|rejected
    formData: jsonb('form_data'),
    calculatedValues: jsonb('calculated_values'),
    submissionReference: varchar('submission_reference', { length: 100 }),
    submittedAt: timestamp('submitted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('compliance_reports_organization_id_idx').on(
      table.organizationId,
    ),
    createdByIdx: index('compliance_reports_created_by_idx').on(
      table.createdByUserId,
    ),
    reportTypeIdx: index('compliance_reports_report_type_idx').on(
      table.reportType,
    ),
    statusIdx: index('compliance_reports_status_idx').on(table.status),
    dueDateIdx: index('compliance_reports_due_date_idx').on(table.dueDate),
    periodIdx: index('compliance_reports_period_idx').on(
      table.reportingPeriodStart,
      table.reportingPeriodEnd,
    ),
  }),
);

/**
 * JIB Statements table - Joint Interest Billing statements for partners
 */
export const jibStatements = pgTable(
  'jib_statements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    statementPeriodStart: date('statement_period_start').notNull(),
    statementPeriodEnd: date('statement_period_end').notNull(),
    grossRevenue: decimal('gross_revenue', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    netRevenue: decimal('net_revenue', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    workingInterestShare: decimal('working_interest_share', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),
    royaltyShare: decimal('royalty_share', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    lineItems: jsonb('line_items'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft|sent|paid
    sentAt: timestamp('sent_at'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('jib_statements_organization_id_idx').on(
      table.organizationId,
    ),
    partnerIdx: index('jib_statements_partner_id_idx').on(table.partnerId),
    leaseIdx: index('jib_statements_lease_id_idx').on(table.leaseId),
    statusIdx: index('jib_statements_status_idx').on(table.status),
    periodIdx: index('jib_statements_period_idx').on(
      table.statementPeriodStart,
      table.statementPeriodEnd,
    ),
    partnerPeriodIdx: index('jib_statements_partner_period_idx').on(
      table.partnerId,
      table.statementPeriodStart,
    ),
  }),
);

// =============================================================================
// DOCUMENT & EQUIPMENT ENTITIES
// =============================================================================

/**
 * Documents table - Centralized document storage and management
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    uploadedByUserId: uuid('uploaded_by_user_id')
      .notNull()
      .references(() => users.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    wellId: uuid('well_id').references(() => wells.id),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(), // lease|permit|contract|report|other
    filePath: varchar('file_path', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),
    metadata: jsonb('metadata'),
    expirationDate: date('expiration_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('documents_organization_id_idx').on(
      table.organizationId,
    ),
    uploadedByIdx: index('documents_uploaded_by_idx').on(
      table.uploadedByUserId,
    ),
    leaseIdx: index('documents_lease_id_idx').on(table.leaseId),
    wellIdx: index('documents_well_id_idx').on(table.wellId),
    documentTypeIdx: index('documents_document_type_idx').on(
      table.documentType,
    ),
    expirationIdx: index('documents_expiration_date_idx').on(
      table.expirationDate,
    ),
  }),
);

/**
 * Equipment table - Well equipment inventory and management
 */
export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    equipmentName: varchar('equipment_name', { length: 255 }).notNull(),
    equipmentType: varchar('equipment_type', { length: 50 }).notNull(), // pump|tank|meter|separator
    manufacturer: varchar('manufacturer', { length: 100 }),
    model: varchar('model', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    installationDate: date('installation_date'),
    specifications: jsonb('specifications'),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active|maintenance|retired
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wellIdx: index('equipment_well_id_idx').on(table.wellId),
    equipmentTypeIdx: index('equipment_equipment_type_idx').on(
      table.equipmentType,
    ),
    statusIdx: index('equipment_status_idx').on(table.status),
    serialNumberIdx: index('equipment_serial_number_idx').on(
      table.serialNumber,
    ),
  }),
);

/**
 * Well Tests table - Periodic well performance testing
 */
export const wellTests = pgTable(
  'well_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    conductedByUserId: uuid('conducted_by_user_id')
      .notNull()
      .references(() => users.id),
    testDate: date('test_date').notNull(),
    testType: varchar('test_type', { length: 20 }).notNull(), // initial|periodic|regulatory
    oilRate: decimal('oil_rate', { precision: 10, scale: 2 }),
    gasRate: decimal('gas_rate', { precision: 12, scale: 2 }),
    waterRate: decimal('water_rate', { precision: 10, scale: 2 }),
    flowingPressure: decimal('flowing_pressure', { precision: 8, scale: 2 }),
    staticPressure: decimal('static_pressure', { precision: 8, scale: 2 }),
    testConditions: jsonb('test_conditions'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wellIdx: index('well_tests_well_id_idx').on(table.wellId),
    conductedByIdx: index('well_tests_conducted_by_idx').on(
      table.conductedByUserId,
    ),
    testDateIdx: index('well_tests_test_date_idx').on(table.testDate),
    testTypeIdx: index('well_tests_test_type_idx').on(table.testType),
    wellDateIdx: index('well_tests_well_date_idx').on(
      table.wellId,
      table.testDate,
    ),
  }),
);

// =============================================================================
// DRIZZLE RELATIONS
// =============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  leases: many(leases),
  wells: many(wells),
  partners: many(partners),
  complianceReports: many(complianceReports),
  jibStatements: many(jibStatements),
  documents: many(documents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  productionRecords: many(productionRecords),
  complianceReports: many(complianceReports),
  wellTests: many(wellTests),
  documents: many(documents),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leases.organizationId],
    references: [organizations.id],
  }),
  wells: many(wells),
  leasePartners: many(leasePartners),
  jibStatements: many(jibStatements),
  documents: many(documents),
}));

export const wellsRelations = relations(wells, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [wells.organizationId],
    references: [organizations.id],
  }),
  lease: one(leases, {
    fields: [wells.leaseId],
    references: [leases.id],
  }),
  productionRecords: many(productionRecords),
  equipment: many(equipment),
  wellTests: many(wellTests),
  documents: many(documents),
}));

export const productionRecordsRelations = relations(
  productionRecords,
  ({ one }) => ({
    well: one(wells, {
      fields: [productionRecords.wellId],
      references: [wells.id],
    }),
    createdByUser: one(users, {
      fields: [productionRecords.createdByUserId],
      references: [users.id],
    }),
  }),
);

export const partnersRelations = relations(partners, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [partners.organizationId],
    references: [organizations.id],
  }),
  leasePartners: many(leasePartners),
  jibStatements: many(jibStatements),
}));

export const leasePartnersRelations = relations(leasePartners, ({ one }) => ({
  lease: one(leases, {
    fields: [leasePartners.leaseId],
    references: [leases.id],
  }),
  partner: one(partners, {
    fields: [leasePartners.partnerId],
    references: [partners.id],
  }),
}));

export const complianceReportsRelations = relations(
  complianceReports,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [complianceReports.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [complianceReports.createdByUserId],
      references: [users.id],
    }),
  }),
);

export const jibStatementsRelations = relations(jibStatements, ({ one }) => ({
  organization: one(organizations, {
    fields: [jibStatements.organizationId],
    references: [organizations.id],
  }),
  partner: one(partners, {
    fields: [jibStatements.partnerId],
    references: [partners.id],
  }),
  lease: one(leases, {
    fields: [jibStatements.leaseId],
    references: [leases.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id],
  }),
  lease: one(leases, {
    fields: [documents.leaseId],
    references: [leases.id],
  }),
  well: one(wells, {
    fields: [documents.wellId],
    references: [wells.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  well: one(wells, {
    fields: [equipment.wellId],
    references: [wells.id],
  }),
}));

export const wellTestsRelations = relations(wellTests, ({ one }) => ({
  well: one(wells, {
    fields: [wellTests.wellId],
    references: [wells.id],
  }),
  conductedByUser: one(users, {
    fields: [wellTests.conductedByUserId],
    references: [users.id],
  }),
}));

// =============================================================================
// TYPESCRIPT TYPES
// =============================================================================

// Organization types
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

// User types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Lease types
export type Lease = typeof leases.$inferSelect;
export type NewLease = typeof leases.$inferInsert;

// Well types
export type Well = typeof wells.$inferSelect;
export type NewWell = typeof wells.$inferInsert;

// Production Record types
export type ProductionRecord = typeof productionRecords.$inferSelect;
export type NewProductionRecord = typeof productionRecords.$inferInsert;

// Partner types
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

// Lease Partner types
export type LeasePartner = typeof leasePartners.$inferSelect;
export type NewLeasePartner = typeof leasePartners.$inferInsert;

// Compliance Report types
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type NewComplianceReport = typeof complianceReports.$inferInsert;

// JIB Statement types
export type JibStatement = typeof jibStatements.$inferSelect;
export type NewJibStatement = typeof jibStatements.$inferInsert;

// Document types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// Equipment types
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

// Well Test types
export type WellTest = typeof wellTests.$inferSelect;
export type NewWellTest = typeof wellTests.$inferInsert;
