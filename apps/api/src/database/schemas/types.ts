// Import all table schemas
import {
  afes,
  afeLineItems,
  afeApprovals,
  chainOfTitleEntries,
  complianceReports,
  complianceSchedules,
  curativeActivities,
  curativeItems,
  declineCurves,
  documents,
  environmentalIncidents,
  enhancedProduction,
  equipment,
  formationTops,
  geologicalData,
  jointOperatingAgreements,
  leasePartners,
  leaseOperatingStatements,
  leases,
  organizations,
  ownerPayments,
  partners,
  productionAllocation,
  productionRecords,
  regulatoryFilings,
  reserves,
  reservesValidations,
  revenueDistributions,
  spillReports,
  titleOpinionDocuments,
  titleOpinions,
  users,
  vendorContacts,
  vendorContracts,
  vendorPerformanceReviews,
  vendorQualifications,
  vendors,
  wellPerformance,
  wellTests,
  wells,
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

// Geological Data types
export type GeologicalData = typeof geologicalData.$inferSelect;
export type NewGeologicalData = typeof geologicalData.$inferInsert;

export type FormationTop = typeof formationTops.$inferSelect;
export type NewFormationTop = typeof formationTops.$inferInsert;

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

export type WellPerformance = typeof wellPerformance.$inferSelect;
export type NewWellPerformance = typeof wellPerformance.$inferInsert;

export type EnhancedProduction = typeof enhancedProduction.$inferSelect;
export type NewEnhancedProduction = typeof enhancedProduction.$inferInsert;

export type ProductionAllocation = typeof productionAllocation.$inferSelect;
export type NewProductionAllocation = typeof productionAllocation.$inferInsert;

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

// Financial enhancement types
export type OwnerPayment = typeof ownerPayments.$inferSelect;
export type NewOwnerPayment = typeof ownerPayments.$inferInsert;

export type CashCall = typeof cashCalls.$inferSelect;
export type NewCashCall = typeof cashCalls.$inferInsert;

export type JointOperatingAgreement =
  typeof jointOperatingAgreements.$inferSelect;
export type NewJointOperatingAgreement =
  typeof jointOperatingAgreements.$inferInsert;

export type ComplianceSchedule = typeof complianceSchedules.$inferSelect;
export type NewComplianceSchedule = typeof complianceSchedules.$inferInsert;

// Reserves management types
export type Reserve = typeof reserves.$inferSelect;
export type NewReserve = typeof reserves.$inferInsert;

export type DeclineCurve = typeof declineCurves.$inferSelect;
export type NewDeclineCurve = typeof declineCurves.$inferInsert;

export type ReservesValidation = typeof reservesValidations.$inferSelect;
export type NewReservesValidation = typeof reservesValidations.$inferInsert;
