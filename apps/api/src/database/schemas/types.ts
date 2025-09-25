// Import all table schemas
import {
  organizations,
  users,
  leases,
  wells,
  productionRecords,
  partners,
  leasePartners,
  complianceReports,
  jibStatements,
  documents,
  equipment,
  wellTests,
  afes,
  afeLineItems,
  afeApprovals,
  divisionOrders,
  revenueDistributions,
  leaseOperatingStatements,
  vendors,
  vendorContacts,
  vendorContracts,
  vendorPerformanceReviews,
  vendorQualifications,
  titleOpinions,
  curativeItems,
  environmentalIncidents,
  spillReports,
  regulatoryFilings,
  complianceSchedules,
  chainOfTitleEntries,
  titleOpinionDocuments,
  curativeActivities,
} from './index';

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

// AFE types
export type Afe = typeof afes.$inferSelect;
export type NewAfe = typeof afes.$inferInsert;

export type AfeLineItem = typeof afeLineItems.$inferSelect;
export type NewAfeLineItem = typeof afeLineItems.$inferInsert;

export type AfeApproval = typeof afeApprovals.$inferSelect;
export type NewAfeApproval = typeof afeApprovals.$inferInsert;

// Division Order types
export type DivisionOrder = typeof divisionOrders.$inferSelect;
export type NewDivisionOrder = typeof divisionOrders.$inferInsert;

// Revenue Distribution types
export type RevenueDistribution = typeof revenueDistributions.$inferSelect;
export type NewRevenueDistribution = typeof revenueDistributions.$inferInsert;

// Lease Operating Statement types
export type LeaseOperatingStatement =
  typeof leaseOperatingStatements.$inferSelect;
export type NewLeaseOperatingStatement =
  typeof leaseOperatingStatements.$inferInsert;

// Vendor types
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type VendorContact = typeof vendorContacts.$inferSelect;
export type NewVendorContact = typeof vendorContacts.$inferInsert;

export type VendorContract = typeof vendorContracts.$inferSelect;
export type NewVendorContract = typeof vendorContracts.$inferInsert;

export type VendorPerformanceReview =
  typeof vendorPerformanceReviews.$inferSelect;
export type NewVendorPerformanceReview =
  typeof vendorPerformanceReviews.$inferInsert;

export type VendorQualification = typeof vendorQualifications.$inferSelect;
export type NewVendorQualification = typeof vendorQualifications.$inferInsert;

// Title Management types
export type TitleOpinion = typeof titleOpinions.$inferSelect;
export type NewTitleOpinion = typeof titleOpinions.$inferInsert;

export type CurativeItem = typeof curativeItems.$inferSelect;
export type NewCurativeItem = typeof curativeItems.$inferInsert;

// Environmental types
export type EnvironmentalIncident = typeof environmentalIncidents.$inferSelect;
export type NewEnvironmentalIncident =
  typeof environmentalIncidents.$inferInsert;

export type SpillReport = typeof spillReports.$inferSelect;
export type NewSpillReport = typeof spillReports.$inferInsert;

// Regulatory types
export type RegulatoryFiling = typeof regulatoryFilings.$inferSelect;
export type NewRegulatoryFiling = typeof regulatoryFilings.$inferInsert;

// Chain of Title types
export type ChainOfTitleEntry = typeof chainOfTitleEntries.$inferSelect;
export type NewChainOfTitleEntry = typeof chainOfTitleEntries.$inferInsert;

// Title Opinion Document link types
export type TitleOpinionDocument = typeof titleOpinionDocuments.$inferSelect;
export type NewTitleOpinionDocument = typeof titleOpinionDocuments.$inferInsert;

// Curative Activity types
export type CurativeActivity = typeof curativeActivities.$inferSelect;
export type NewCurativeActivity = typeof curativeActivities.$inferInsert;

export type ComplianceSchedule = typeof complianceSchedules.$inferSelect;
export type NewComplianceSchedule = typeof complianceSchedules.$inferInsert;
