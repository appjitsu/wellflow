import { relations } from 'drizzle-orm';

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
  geologicalData,
  formationTops,
  reserves,
  declineCurves,
  reservesValidations,
  wellPerformance,
  enhancedProduction,
  productionAllocation,
  ownerPayments,
  cashCalls,
  jointOperatingAgreements,
  // Operational management
  drillingPrograms,
  dailyDrillingReports,
  workovers,
  maintenanceSchedules,
} from './index';

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
  afes: many(afes),
  divisionOrders: many(divisionOrders),
  revenueDistributions: many(revenueDistributions),
  leaseOperatingStatements: many(leaseOperatingStatements),
  vendors: many(vendors),
  titleOpinions: many(titleOpinions),
  chainOfTitleEntries: many(chainOfTitleEntries),
  environmentalIncidents: many(environmentalIncidents),
  regulatoryFilings: many(regulatoryFilings),
  ownerPayments: many(ownerPayments),
  cashCalls: many(cashCalls),
  jointOperatingAgreements: many(jointOperatingAgreements),
  geologicalData: many(geologicalData),
  formationTops: many(formationTops),
  reserves: many(reserves),
  declineCurves: many(declineCurves),
  reservesValidations: many(reservesValidations),
  wellPerformance: many(wellPerformance),
  enhancedProduction: many(enhancedProduction),
  productionAllocation: many(productionAllocation),

  complianceSchedules: many(complianceSchedules),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  complianceReports: many(complianceReports),
  wellTests: many(wellTests),
  documents: many(documents),
  environmentalIncidents: many(environmentalIncidents),
  regulatoryFilings: many(regulatoryFilings),
  afeApprovals: many(afeApprovals),
  geologicalDataCreated: many(geologicalData),
  geologicalDataInterpreted: many(geologicalData),
  declineCurvesCreated: many(declineCurves),
  reservesValidationsRequested: many(reservesValidations),
  reservesValidationsReviewed: many(reservesValidations),
  wellPerformanceCreated: many(wellPerformance),
  wellPerformanceUpdated: many(wellPerformance),
  enhancedProductionRecorded: many(enhancedProduction),
  productionAllocationsCreated: many(productionAllocation),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leases.organizationId],
    references: [organizations.id],
  }),
  wells: many(wells),
  cashCalls: many(cashCalls),

  leasePartners: many(leasePartners),
  jibStatements: many(jibStatements),
  documents: many(documents),
  afes: many(afes),
  leaseOperatingStatements: many(leaseOperatingStatements),
  titleOpinions: many(titleOpinions),
  chainOfTitleEntries: many(chainOfTitleEntries),
  reserves: many(reserves),
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
  afes: many(afes),
  divisionOrders: many(divisionOrders),
  revenueDistributions: many(revenueDistributions),
  environmentalIncidents: many(environmentalIncidents),
  regulatoryFilings: many(regulatoryFilings),
  complianceSchedules: many(complianceSchedules),
  geologicalData: many(geologicalData),
  formationTops: many(formationTops),
  reserves: many(reserves),
  declineCurves: many(declineCurves),
  enhancedProduction: many(enhancedProduction),
  productionAllocation: many(productionAllocation),
  wellPerformance: many(wellPerformance),
}));

export const productionRecordsRelations = relations(
  productionRecords,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [productionRecords.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [productionRecords.wellId],
      references: [wells.id],
    }),
    wellPerformanceRecords: many(wellPerformance),
  }),
);

export const partnersRelations = relations(partners, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [partners.organizationId],
    references: [organizations.id],
  }),
  ownerPayments: many(ownerPayments),
  cashCalls: many(cashCalls),

  leasePartners: many(leasePartners),
  jibStatements: many(jibStatements),
  afeApprovals: many(afeApprovals),
  divisionOrders: many(divisionOrders),
  revenueDistributions: many(revenueDistributions),
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
  cashCall: one(cashCalls, {
    fields: [jibStatements.cashCallId],
    references: [cashCalls.id],
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

export const geologicalDataRelations = relations(
  geologicalData,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [geologicalData.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [geologicalData.wellId],
      references: [wells.id],
    }),
    createdByUser: one(users, {
      fields: [geologicalData.createdByUserId],
      references: [users.id],
    }),
    interpretedByUser: one(users, {
      fields: [geologicalData.interpretedByUserId],
      references: [users.id],
    }),
    formationTops: many(formationTops),
  }),
);

export const formationTopsRelations = relations(formationTops, ({ one }) => ({
  organization: one(organizations, {
    fields: [formationTops.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [formationTops.wellId],
    references: [wells.id],
  }),
  geologicalData: one(geologicalData, {
    fields: [formationTops.geologicalDataId],
    references: [geologicalData.id],
  }),
}));

export const reservesRelations = relations(reserves, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [reserves.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [reserves.wellId],
    references: [wells.id],
  }),
  lease: one(leases, {
    fields: [reserves.leaseId],
    references: [leases.id],
  }),
  evaluatorPartner: one(partners, {
    fields: [reserves.evaluatorPartnerId],
    references: [partners.id],
  }),
  declineCurves: many(declineCurves),
  reservesValidations: many(reservesValidations),
}));

export const declineCurvesRelations = relations(declineCurves, ({ one }) => ({
  organization: one(organizations, {
    fields: [declineCurves.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [declineCurves.wellId],
    references: [wells.id],
  }),
  reserves: one(reserves, {
    fields: [declineCurves.reservesId],
    references: [reserves.id],
  }),
  createdByUser: one(users, {
    fields: [declineCurves.createdByUserId],
    references: [users.id],
  }),
}));

export const reservesValidationsRelations = relations(
  reservesValidations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [reservesValidations.organizationId],
      references: [organizations.id],
    }),
    reserves: one(reserves, {
      fields: [reservesValidations.reservesId],
      references: [reserves.id],
    }),
    validatorPartner: one(partners, {
      fields: [reservesValidations.validatorPartnerId],
      references: [partners.id],
    }),
    requestedByUser: one(users, {
      fields: [reservesValidations.requestedByUserId],
      references: [users.id],
    }),
    reviewedByUser: one(users, {
      fields: [reservesValidations.reviewedByUserId],
      references: [users.id],
    }),
  }),
);

export const enhancedProductionRelations = relations(
  enhancedProduction,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [enhancedProduction.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [enhancedProduction.wellId],
      references: [wells.id],
    }),
    productionRecord: one(productionRecords, {
      fields: [enhancedProduction.productionRecordId],
      references: [productionRecords.id],
    }),
    recordedByUser: one(users, {
      fields: [enhancedProduction.recordedByUserId],
      references: [users.id],
    }),
  }),
);

export const productionAllocationRelations = relations(
  productionAllocation,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [productionAllocation.organizationId],
      references: [organizations.id],
    }),
    lease: one(leases, {
      fields: [productionAllocation.leaseId],
      references: [leases.id],
    }),
    well: one(wells, {
      fields: [productionAllocation.wellId],
      references: [wells.id],
    }),
    createdByUser: one(users, {
      fields: [productionAllocation.createdByUserId],
      references: [users.id],
    }),
    enhancedProductionRecords: many(enhancedProduction),
  }),
);

export const wellPerformanceRelations = relations(
  wellPerformance,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [wellPerformance.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [wellPerformance.wellId],
      references: [wells.id],
    }),
    productionRecord: one(productionRecords, {
      fields: [wellPerformance.productionRecordId],
      references: [productionRecords.id],
    }),
    createdByUser: one(users, {
      fields: [wellPerformance.createdByUserId],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [wellPerformance.updatedByUserId],
      references: [users.id],
    }),
  }),
);

export const afesRelations = relations(afes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [afes.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [afes.wellId],
    references: [wells.id],
  }),
  lease: one(leases, {
    fields: [afes.leaseId],
    references: [leases.id],
  }),
  lineItems: many(afeLineItems),
  approvals: many(afeApprovals),
}));

export const afeLineItemsRelations = relations(afeLineItems, ({ one }) => ({
  afe: one(afes, {
    fields: [afeLineItems.afeId],
    references: [afes.id],
  }),
  vendor: one(vendors, {
    fields: [afeLineItems.vendorId],
    references: [vendors.id],
  }),
}));

export const afeApprovalsRelations = relations(afeApprovals, ({ one }) => ({
  afe: one(afes, {
    fields: [afeApprovals.afeId],
    references: [afes.id],
  }),
  partner: one(partners, {
    fields: [afeApprovals.partnerId],
    references: [partners.id],
  }),
  approvedByUser: one(users, {
    fields: [afeApprovals.approvedByUserId],
    references: [users.id],
  }),
}));

export const divisionOrdersRelations = relations(divisionOrders, ({ one }) => ({
  organization: one(organizations, {
    fields: [divisionOrders.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [divisionOrders.wellId],
    references: [wells.id],
  }),
  partner: one(partners, {
    fields: [divisionOrders.partnerId],
    references: [partners.id],
  }),
}));

export const revenueDistributionsRelations = relations(
  revenueDistributions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [revenueDistributions.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [revenueDistributions.wellId],
      references: [wells.id],
    }),
    partner: one(partners, {
      fields: [revenueDistributions.partnerId],
      references: [partners.id],
    }),
    divisionOrder: one(divisionOrders, {
      fields: [revenueDistributions.divisionOrderId],
      references: [divisionOrders.id],
    }),
  }),
);

export const ownerPaymentsRelations = relations(ownerPayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [ownerPayments.organizationId],
    references: [organizations.id],
  }),
  partner: one(partners, {
    fields: [ownerPayments.partnerId],
    references: [partners.id],
  }),
  revenueDistribution: one(revenueDistributions, {
    fields: [ownerPayments.revenueDistributionId],
    references: [revenueDistributions.id],
  }),
}));

export const cashCallsRelations = relations(cashCalls, ({ one }) => ({
  organization: one(organizations, {
    fields: [cashCalls.organizationId],
    references: [organizations.id],
  }),
  lease: one(leases, {
    fields: [cashCalls.leaseId],
    references: [leases.id],
  }),
  partner: one(partners, {
    fields: [cashCalls.partnerId],
    references: [partners.id],
  }),
}));

export const jointOperatingAgreementsRelations = relations(
  jointOperatingAgreements,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [jointOperatingAgreements.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const leaseOperatingStatementsRelations = relations(
  leaseOperatingStatements,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [leaseOperatingStatements.organizationId],
      references: [organizations.id],
    }),
    lease: one(leases, {
      fields: [leaseOperatingStatements.leaseId],
      references: [leases.id],
    }),
  }),
);

export const titleOpinionsRelations = relations(
  titleOpinions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [titleOpinions.organizationId],
      references: [organizations.id],
    }),
    lease: one(leases, {
      fields: [titleOpinions.leaseId],
      references: [leases.id],
    }),
    curativeItems: many(curativeItems),
    titleOpinionDocuments: many(titleOpinionDocuments),
  }),
);

export const curativeItemsRelations = relations(
  curativeItems,
  ({ one, many }) => ({
    titleOpinion: one(titleOpinions, {
      fields: [curativeItems.titleOpinionId],
      references: [titleOpinions.id],
    }),
    activities: many(curativeActivities),
  }),
);

export const chainOfTitleEntriesRelations = relations(
  chainOfTitleEntries,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [chainOfTitleEntries.organizationId],
      references: [organizations.id],
    }),
    lease: one(leases, {
      fields: [chainOfTitleEntries.leaseId],
      references: [leases.id],
    }),
  }),
);

export const titleOpinionDocumentsRelations = relations(
  titleOpinionDocuments,
  ({ one }) => ({
    titleOpinion: one(titleOpinions, {
      fields: [titleOpinionDocuments.titleOpinionId],
      references: [titleOpinions.id],
    }),
    document: one(documents, {
      fields: [titleOpinionDocuments.documentId],
      references: [documents.id],
    }),
  }),
);

export const curativeActivitiesRelations = relations(
  curativeActivities,
  ({ one }) => ({
    curativeItem: one(curativeItems, {
      fields: [curativeActivities.curativeItemId],
      references: [curativeItems.id],
    }),
  }),
);

export const environmentalIncidentsRelations = relations(
  environmentalIncidents,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [environmentalIncidents.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [environmentalIncidents.wellId],
      references: [wells.id],
    }),
    reportedByUser: one(users, {
      fields: [environmentalIncidents.reportedByUserId],
      references: [users.id],
    }),
    spillReports: many(spillReports),
  }),
);

export const spillReportsRelations = relations(spillReports, ({ one }) => ({
  environmentalIncident: one(environmentalIncidents, {
    fields: [spillReports.environmentalIncidentId],
    references: [environmentalIncidents.id],
  }),
}));

export const regulatoryFilingsRelations = relations(
  regulatoryFilings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [regulatoryFilings.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [regulatoryFilings.wellId],
      references: [wells.id],
    }),
    filedByUser: one(users, {
      fields: [regulatoryFilings.filedByUserId],
      references: [users.id],
    }),
  }),
);

export const complianceSchedulesRelations = relations(
  complianceSchedules,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [complianceSchedules.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [complianceSchedules.wellId],
      references: [wells.id],
    }),
  }),
);

// =============================================================================
// OPERATIONAL MANAGEMENT RELATIONS
// =============================================================================

export const drillingProgramsRelations = relations(
  drillingPrograms,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [drillingPrograms.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [drillingPrograms.wellId],
      references: [wells.id],
    }),
    afe: one(afes, {
      fields: [drillingPrograms.afeId],
      references: [afes.id],
    }),
  }),
);

export const dailyDrillingReportsRelations = relations(
  dailyDrillingReports,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [dailyDrillingReports.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [dailyDrillingReports.wellId],
      references: [wells.id],
    }),
  }),
);

export const workoversRelations = relations(workovers, ({ one }) => ({
  organization: one(organizations, {
    fields: [workovers.organizationId],
    references: [organizations.id],
  }),
  well: one(wells, {
    fields: [workovers.wellId],
    references: [wells.id],
  }),
  afe: one(afes, {
    fields: [workovers.afeId],
    references: [afes.id],
  }),
}));

export const maintenanceSchedulesRelations = relations(
  maintenanceSchedules,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [maintenanceSchedules.organizationId],
      references: [organizations.id],
    }),
    equipment: one(equipment, {
      fields: [maintenanceSchedules.equipmentId],
      references: [equipment.id],
    }),
    vendor: one(vendors, {
      fields: [maintenanceSchedules.vendorId],
      references: [vendors.id],
    }),
  }),
);

// VENDOR MANAGEMENT RELATIONS
// =============================================================================

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.organizationId],
    references: [organizations.id],
  }),
  contacts: many(vendorContacts),
  contracts: many(vendorContracts),
  performanceReviews: many(vendorPerformanceReviews),
  qualifications: many(vendorQualifications),
}));

export const vendorContactsRelations = relations(vendorContacts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorContacts.vendorId],
    references: [vendors.id],
  }),
}));

export const vendorContractsRelations = relations(
  vendorContracts,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [vendorContracts.organizationId],
      references: [organizations.id],
    }),
    vendor: one(vendors, {
      fields: [vendorContracts.vendorId],
      references: [vendors.id],
    }),
    performanceReviews: many(vendorPerformanceReviews),
  }),
);

export const vendorPerformanceReviewsRelations = relations(
  vendorPerformanceReviews,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [vendorPerformanceReviews.organizationId],
      references: [organizations.id],
    }),
    vendor: one(vendors, {
      fields: [vendorPerformanceReviews.vendorId],
      references: [vendors.id],
    }),
    contract: one(vendorContracts, {
      fields: [vendorPerformanceReviews.contractId],
      references: [vendorContracts.id],
    }),
  }),
);

export const vendorQualificationsRelations = relations(
  vendorQualifications,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorQualifications.vendorId],
      references: [vendors.id],
    }),
  }),
);
