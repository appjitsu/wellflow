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
  titleOpinions,
  curativeItems,
  environmentalIncidents,
  spillReports,
  regulatoryFilings,
  complianceSchedules,
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
  environmentalIncidents: many(environmentalIncidents),
  regulatoryFilings: many(regulatoryFilings),
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
  afes: many(afes),
  leaseOperatingStatements: many(leaseOperatingStatements),
  titleOpinions: many(titleOpinions),
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
}));

export const productionRecordsRelations = relations(
  productionRecords,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [productionRecords.organizationId],
      references: [organizations.id],
    }),
    well: one(wells, {
      fields: [productionRecords.wellId],
      references: [wells.id],
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

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.organizationId],
    references: [organizations.id],
  }),
  contacts: many(vendorContacts),
  afeLineItems: many(afeLineItems),
}));

export const vendorContactsRelations = relations(vendorContacts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorContacts.vendorId],
    references: [vendors.id],
  }),
}));

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
  }),
);

export const curativeItemsRelations = relations(curativeItems, ({ one }) => ({
  titleOpinion: one(titleOpinions, {
    fields: [curativeItems.titleOpinionId],
    references: [titleOpinions.id],
  }),
}));

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
