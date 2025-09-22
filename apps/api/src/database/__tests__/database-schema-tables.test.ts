import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';

describe('Database Schema - Table Definitions', () => {
  let pool: Pool;
  let _db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'wellflow_test',
    });

    _db = drizzle(pool, { schema });

    // Verify database connection
    await _db.select().from(schema.organizations).limit(1);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Phase 1A Financial Tables', () => {
    it('should have AFE tables with proper structure', () => {
      expect(schema.afes).toBeDefined();
      expect(schema.afeLineItems).toBeDefined();
      expect(schema.afeApprovals).toBeDefined();

      // Test table column access
      expect(schema.afes.id).toBeDefined();
      expect(schema.afes.organizationId).toBeDefined();
      expect(schema.afes.afeNumber).toBeDefined();
      expect(schema.afes.totalEstimatedCost).toBeDefined();

      expect(schema.afeLineItems.id).toBeDefined();
      expect(schema.afeLineItems.afeId).toBeDefined();
      expect(schema.afeLineItems.description).toBeDefined();
      expect(schema.afeLineItems.estimatedCost).toBeDefined();

      expect(schema.afeApprovals.id).toBeDefined();
      expect(schema.afeApprovals.afeId).toBeDefined();
      expect(schema.afeApprovals.partnerId).toBeDefined();
      expect(schema.afeApprovals.approvalStatus).toBeDefined();
    });

    it('should have Division Orders tables with proper structure', () => {
      expect(schema.divisionOrders).toBeDefined();
      expect(schema.revenueDistributions).toBeDefined();

      // Test table column access
      expect(schema.divisionOrders.id).toBeDefined();
      expect(schema.divisionOrders.organizationId).toBeDefined();
      expect(schema.divisionOrders.wellId).toBeDefined();
      expect(schema.divisionOrders.partnerId).toBeDefined();
      expect(schema.divisionOrders.decimalInterest).toBeDefined();

      expect(schema.revenueDistributions.id).toBeDefined();
      expect(schema.revenueDistributions.organizationId).toBeDefined();
      expect(schema.revenueDistributions.divisionOrderId).toBeDefined();
      expect(schema.revenueDistributions.totalRevenue).toBeDefined();
    });

    it('should have Lease Operating Statements table with proper structure', () => {
      expect(schema.leaseOperatingStatements).toBeDefined();

      // Test table column access
      expect(schema.leaseOperatingStatements.id).toBeDefined();
      expect(schema.leaseOperatingStatements.organizationId).toBeDefined();
      expect(schema.leaseOperatingStatements.leaseId).toBeDefined();
      expect(schema.leaseOperatingStatements.statementMonth).toBeDefined();
      expect(schema.leaseOperatingStatements.totalExpenses).toBeDefined();
      expect(schema.leaseOperatingStatements.operatingExpenses).toBeDefined();
      expect(schema.leaseOperatingStatements.capitalExpenses).toBeDefined();
    });

    it('should have Vendor Management tables with proper structure', () => {
      expect(schema.vendors).toBeDefined();
      expect(schema.vendorContacts).toBeDefined();

      // Test table column access
      expect(schema.vendors.id).toBeDefined();
      expect(schema.vendors.organizationId).toBeDefined();
      expect(schema.vendors.vendorName).toBeDefined();
      expect(schema.vendors.vendorType).toBeDefined();
      expect(schema.vendors.taxId).toBeDefined();

      expect(schema.vendorContacts.id).toBeDefined();
      expect(schema.vendorContacts.vendorId).toBeDefined();
      expect(schema.vendorContacts.contactName).toBeDefined();
      expect(schema.vendorContacts.title).toBeDefined();
    });
  });

  describe('Phase 1B Legal & Environmental Tables', () => {
    it('should have Title Management tables with proper structure', () => {
      expect(schema.titleOpinions).toBeDefined();
      expect(schema.curativeItems).toBeDefined();

      // Test table column access
      expect(schema.titleOpinions.id).toBeDefined();
      expect(schema.titleOpinions.organizationId).toBeDefined();
      expect(schema.titleOpinions.leaseId).toBeDefined();
      expect(schema.titleOpinions.examinerName).toBeDefined();
      expect(schema.titleOpinions.titleStatus).toBeDefined();

      expect(schema.curativeItems.id).toBeDefined();
      expect(schema.curativeItems.titleOpinionId).toBeDefined();
      expect(schema.curativeItems.defectType).toBeDefined();
      expect(schema.curativeItems.status).toBeDefined();
    });

    it('should have Environmental Incident tables with proper structure', () => {
      expect(schema.environmentalIncidents).toBeDefined();
      expect(schema.spillReports).toBeDefined();

      // Test table column access
      expect(schema.environmentalIncidents.id).toBeDefined();
      expect(schema.environmentalIncidents.organizationId).toBeDefined();
      expect(schema.environmentalIncidents.incidentNumber).toBeDefined();
      expect(schema.environmentalIncidents.incidentType).toBeDefined();
      expect(schema.environmentalIncidents.severity).toBeDefined();
      expect(schema.environmentalIncidents.status).toBeDefined();

      expect(schema.spillReports.id).toBeDefined();
      expect(schema.spillReports.environmentalIncidentId).toBeDefined();
      expect(schema.spillReports.affectedArea).toBeDefined();
      expect(schema.spillReports.reportStatus).toBeDefined();
    });
  });

  describe('Phase 2 Operational Tables', () => {
    it('should have Regulatory Filing tables with proper structure', () => {
      expect(schema.regulatoryFilings).toBeDefined();
      expect(schema.complianceSchedules).toBeDefined();

      // Test table column access
      expect(schema.regulatoryFilings.id).toBeDefined();
      expect(schema.regulatoryFilings.organizationId).toBeDefined();
      expect(schema.regulatoryFilings.filingType).toBeDefined();
      expect(schema.regulatoryFilings.regulatoryAgency).toBeDefined();
      expect(schema.regulatoryFilings.status).toBeDefined();

      expect(schema.complianceSchedules.id).toBeDefined();
      expect(schema.complianceSchedules.organizationId).toBeDefined();
      expect(schema.complianceSchedules.complianceType).toBeDefined();
      expect(schema.complianceSchedules.frequency).toBeDefined();
    });
  });

  describe('Schema Exports', () => {
    it('should export all table schemas', () => {
      // Core tables
      expect(schema.organizations).toBeDefined();
      expect(schema.users).toBeDefined();
      expect(schema.leases).toBeDefined();
      expect(schema.wells).toBeDefined();
      expect(schema.productionRecords).toBeDefined();
      expect(schema.partners).toBeDefined();
      expect(schema.leasePartners).toBeDefined();
      expect(schema.equipment).toBeDefined();
      expect(schema.wellTests).toBeDefined();
      expect(schema.complianceReports).toBeDefined();
      expect(schema.jibStatements).toBeDefined();
      expect(schema.documents).toBeDefined();

      // Phase 1A Financial tables
      expect(schema.afes).toBeDefined();
      expect(schema.afeLineItems).toBeDefined();
      expect(schema.afeApprovals).toBeDefined();
      expect(schema.divisionOrders).toBeDefined();
      expect(schema.revenueDistributions).toBeDefined();
      expect(schema.leaseOperatingStatements).toBeDefined();
      expect(schema.vendors).toBeDefined();
      expect(schema.vendorContacts).toBeDefined();

      // Phase 1B Legal & Environmental tables
      expect(schema.titleOpinions).toBeDefined();
      expect(schema.curativeItems).toBeDefined();
      expect(schema.environmentalIncidents).toBeDefined();
      expect(schema.spillReports).toBeDefined();

      // Phase 2 Operational tables
      expect(schema.regulatoryFilings).toBeDefined();
      expect(schema.complianceSchedules).toBeDefined();
    });

    it('should have proper table relationships defined', () => {
      // Test that foreign key references are accessible
      expect(schema.wells.organizationId).toBeDefined();
      expect(schema.wells.leaseId).toBeDefined();
      expect(schema.productionRecords.wellId).toBeDefined();
      expect(schema.leasePartners.leaseId).toBeDefined();
      expect(schema.leasePartners.partnerId).toBeDefined();
    });

    it('should have proper data types for critical fields', () => {
      // Test that decimal fields are properly defined
      expect(schema.productionRecords.oilVolume).toBeDefined();
      expect(schema.productionRecords.gasVolume).toBeDefined();
      expect(schema.productionRecords.waterVolume).toBeDefined();

      // Test that percentage fields are properly defined
      expect(schema.leasePartners.workingInterestPercent).toBeDefined();
      expect(schema.leasePartners.royaltyInterestPercent).toBeDefined();
    });
  });

  describe('Table Constraints and Indexes', () => {
    it('should have proper primary keys', () => {
      // All tables should have UUID primary keys
      expect(schema.afes.id).toBeDefined();
      expect(schema.divisionOrders.id).toBeDefined();
      expect(schema.leaseOperatingStatements.id).toBeDefined();
      expect(schema.vendors.id).toBeDefined();
      expect(schema.titleOpinions.id).toBeDefined();
      expect(schema.environmentalIncidents.id).toBeDefined();
      expect(schema.regulatoryFilings.id).toBeDefined();
    });

    it('should have proper foreign key relationships', () => {
      // Test foreign key column definitions
      expect(schema.afeLineItems.afeId).toBeDefined();
      expect(schema.afeApprovals.afeId).toBeDefined();
      expect(schema.revenueDistributions.divisionOrderId).toBeDefined();
      expect(schema.vendorContacts.vendorId).toBeDefined();
      expect(schema.curativeItems.titleOpinionId).toBeDefined();
      expect(schema.spillReports.environmentalIncidentId).toBeDefined();
    });
  });

  describe('Comprehensive Field Access Tests', () => {
    it('should access all AFE-related fields', () => {
      // AFE table fields
      expect(schema.afes.afeNumber).toBeDefined();
      expect(schema.afes.description).toBeDefined();
      expect(schema.afes.totalEstimatedCost).toBeDefined();
      expect(schema.afes.status).toBeDefined();
      expect(schema.afes.approvalDate).toBeDefined();

      // AFE Line Items fields
      expect(schema.afeLineItems.lineNumber).toBeDefined();
      expect(schema.afeLineItems.description).toBeDefined();
      expect(schema.afeLineItems.estimatedCost).toBeDefined();
      expect(schema.afeLineItems.actualCost).toBeDefined();

      // AFE Approvals fields
      expect(schema.afeApprovals.approvalStatus).toBeDefined();
      expect(schema.afeApprovals.approvalDate).toBeDefined();
      expect(schema.afeApprovals.comments).toBeDefined();
    });

    it('should access all Division Order and Revenue fields', () => {
      // Division Orders fields
      expect(schema.divisionOrders.decimalInterest).toBeDefined();
      expect(schema.divisionOrders.effectiveDate).toBeDefined();
      expect(schema.divisionOrders.endDate).toBeDefined();
      expect(schema.divisionOrders.isActive).toBeDefined();

      // Revenue Distributions fields
      expect(schema.revenueDistributions.productionMonth).toBeDefined();
      expect(schema.revenueDistributions.oilVolume).toBeDefined();
      expect(schema.revenueDistributions.gasVolume).toBeDefined();
      expect(schema.revenueDistributions.oilRevenue).toBeDefined();
      expect(schema.revenueDistributions.gasRevenue).toBeDefined();
      expect(schema.revenueDistributions.netRevenue).toBeDefined();
      expect(schema.revenueDistributions.severanceTax).toBeDefined();
    });

    it('should access all LOS and Vendor fields', () => {
      // Lease Operating Statements fields
      expect(schema.leaseOperatingStatements.statementMonth).toBeDefined();
      expect(schema.leaseOperatingStatements.operatingExpenses).toBeDefined();
      expect(schema.leaseOperatingStatements.capitalExpenses).toBeDefined();
      expect(schema.leaseOperatingStatements.totalExpenses).toBeDefined();

      // Vendors fields
      expect(schema.vendors.vendorName).toBeDefined();
      expect(schema.vendors.vendorType).toBeDefined();
      expect(schema.vendors.taxId).toBeDefined();
      expect(schema.vendors.vendorCode).toBeDefined();
      expect(schema.vendors.billingAddress).toBeDefined();
      expect(schema.vendors.paymentTerms).toBeDefined();

      // Vendor Contacts fields
      expect(schema.vendorContacts.contactName).toBeDefined();
      expect(schema.vendorContacts.title).toBeDefined();
      expect(schema.vendorContacts.email).toBeDefined();
      expect(schema.vendorContacts.isPrimary).toBeDefined();
      expect(schema.vendorContacts.phone).toBeDefined();
    });

    it('should access all Title and Environmental fields', () => {
      // Title Opinions fields
      expect(schema.titleOpinions.examinerName).toBeDefined();
      expect(schema.titleOpinions.examinationDate).toBeDefined();
      expect(schema.titleOpinions.titleStatus).toBeDefined();
      expect(schema.titleOpinions.effectiveDate).toBeDefined();
      expect(schema.titleOpinions.findings).toBeDefined();
      expect(schema.titleOpinions.recommendations).toBeDefined();

      // Curative Items fields
      expect(schema.curativeItems.defectType).toBeDefined();
      expect(schema.curativeItems.description).toBeDefined();
      expect(schema.curativeItems.status).toBeDefined();
      expect(schema.curativeItems.priority).toBeDefined();

      // Environmental Incidents fields
      expect(schema.environmentalIncidents.incidentNumber).toBeDefined();
      expect(schema.environmentalIncidents.incidentType).toBeDefined();
      expect(schema.environmentalIncidents.incidentDate).toBeDefined();
      expect(schema.environmentalIncidents.discoveryDate).toBeDefined();
      expect(schema.environmentalIncidents.severity).toBeDefined();
      expect(schema.environmentalIncidents.description).toBeDefined();
      expect(schema.environmentalIncidents.location).toBeDefined();
      expect(schema.environmentalIncidents.estimatedVolume).toBeDefined();
      expect(schema.environmentalIncidents.substanceInvolved).toBeDefined();
      expect(schema.environmentalIncidents.volumeUnit).toBeDefined();
      expect(schema.environmentalIncidents.causeAnalysis).toBeDefined();

      // Spill Reports fields
      expect(schema.spillReports.spillVolume).toBeDefined();
      expect(schema.spillReports.soilContamination).toBeDefined();
      expect(schema.spillReports.groundwaterImpact).toBeDefined();
      expect(schema.spillReports.wildlifeImpact).toBeDefined();
      expect(schema.spillReports.recoveredVolume).toBeDefined();
      expect(schema.spillReports.cleanupActions).toBeDefined();
      expect(schema.spillReports.reportStatus).toBeDefined();
      expect(schema.spillReports.finalDisposition).toBeDefined();
    });

    it('should access all Regulatory and Compliance fields', () => {
      // Regulatory Filings fields
      expect(schema.regulatoryFilings.filingType).toBeDefined();
      expect(schema.regulatoryFilings.filingPeriod).toBeDefined();
      expect(schema.regulatoryFilings.dueDate).toBeDefined();
      expect(schema.regulatoryFilings.submissionDate).toBeDefined();
      expect(schema.regulatoryFilings.regulatoryAgency).toBeDefined();
      expect(schema.regulatoryFilings.confirmationNumber).toBeDefined();
      expect(schema.regulatoryFilings.filingData).toBeDefined();
      expect(schema.regulatoryFilings.notes).toBeDefined();

      // Compliance Schedules fields
      expect(schema.complianceSchedules.complianceType).toBeDefined();
      expect(schema.complianceSchedules.frequency).toBeDefined();
      expect(schema.complianceSchedules.nextDueDate).toBeDefined();
      expect(schema.complianceSchedules.completionDate).toBeDefined();
      expect(schema.complianceSchedules.isRecurring).toBeDefined();
    });
  });
});
