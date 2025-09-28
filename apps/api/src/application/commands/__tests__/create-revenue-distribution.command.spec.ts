import { CreateRevenueDistributionCommand } from '../create-revenue-distribution.command';

describe('CreateRevenueDistributionCommand', () => {
  const validOrganizationId = 'org-123';
  const validWellId = 'well-456';
  const validPartnerId = 'partner-789';
  const validDivisionOrderId = 'division-order-101';
  const validProductionMonth = '2024-01';
  const validProductionVolumes = {
    oilVolume: 1000,
    gasVolume: 5000,
  };
  const validRevenueBreakdown = {
    oilRevenue: 50000,
    gasRevenue: 25000,
    totalRevenue: 75000,
    severanceTax: 7500,
    adValorem: 2250,
    transportationCosts: 1500,
    processingCosts: 3000,
    otherDeductions: 500,
    netRevenue: 52500,
  };
  const validCreatedBy = 'user-202';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.divisionOrderId).toBe(validDivisionOrderId);
      expect(command.productionMonth).toBe(validProductionMonth);
      expect(command.productionVolumes).toEqual(validProductionVolumes);
      expect(command.revenueBreakdown).toEqual(validRevenueBreakdown);
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with createdBy', () => {
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
        validCreatedBy,
      );

      expect(command.createdBy).toBe(validCreatedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.wellId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.divisionOrderId).toBeDefined();
      expect(command.productionMonth).toBeDefined();
      expect(command.productionVolumes).toBeDefined();
      expect(command.revenueBreakdown).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty production volumes', () => {
      const emptyVolumes = {};
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        emptyVolumes,
        validRevenueBreakdown,
      );

      expect(command.productionVolumes).toEqual(emptyVolumes);
    });

    it('should handle partial revenue breakdown', () => {
      const partialBreakdown = {
        totalRevenue: 100000,
        netRevenue: 80000,
      };
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        validProductionVolumes,
        partialBreakdown,
      );

      expect(command.revenueBreakdown).toEqual(partialBreakdown);
    });

    it('should handle zero values in volumes and revenues', () => {
      const zeroVolumes = { oilVolume: 0, gasVolume: 0 };
      const zeroBreakdown = {
        oilRevenue: 0,
        gasRevenue: 0,
        totalRevenue: 0,
        netRevenue: 0,
      };
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        zeroVolumes,
        zeroBreakdown,
      );

      expect(command.productionVolumes).toEqual(zeroVolumes);
      expect(command.revenueBreakdown).toEqual(zeroBreakdown);
    });

    it('should handle negative values', () => {
      const negativeVolumes = { oilVolume: -100, gasVolume: -500 };
      const negativeBreakdown = {
        oilRevenue: -5000,
        gasRevenue: -2500,
        totalRevenue: -7500,
        netRevenue: -5250,
      };
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        negativeVolumes,
        negativeBreakdown,
      );

      expect(command.productionVolumes).toEqual(negativeVolumes);
      expect(command.revenueBreakdown).toEqual(negativeBreakdown);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateRevenueDistributionCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDivisionOrderId,
        validProductionMonth,
        validProductionVolumes,
        validRevenueBreakdown,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const wellId1 = command.wellId;
      const wellId2 = command.wellId;

      expect(orgId1).toBe(orgId2);
      expect(wellId1).toBe(wellId2);
    });
  });
});
