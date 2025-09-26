import { RecalculateRevenueDistributionCommand } from './recalculate-revenue-distribution.command';

describe('RecalculateRevenueDistributionCommand', () => {
  const validRevenueDistributionId = 'dist-123';
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
    netRevenue: 60000,
  };
  const validCalculatedBy = 'user-456';
  const validReason = 'Updated production volumes';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.revenueDistributionId).toBe(validRevenueDistributionId);
      expect(command.productionVolumes).toEqual(validProductionVolumes);
      expect(command.revenueBreakdown).toEqual(validRevenueBreakdown);
      expect(command.calculatedBy).toBe(validCalculatedBy);
      expect(command.reason).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
        validReason,
      );

      expect(command.revenueDistributionId).toBe(validRevenueDistributionId);
      expect(command.productionVolumes).toEqual(validProductionVolumes);
      expect(command.revenueBreakdown).toEqual(validRevenueBreakdown);
      expect(command.calculatedBy).toBe(validCalculatedBy);
      expect(command.reason).toBe(validReason);
    });

    it('should create a command with minimal production volumes', () => {
      const minimalVolumes = {};
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        minimalVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.productionVolumes).toEqual(minimalVolumes);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
        validReason,
      );

      expect(command.revenueDistributionId).toBeDefined();
      expect(command.productionVolumes).toBeDefined();
      expect(command.revenueBreakdown).toBeDefined();
      expect(command.calculatedBy).toBeDefined();
      expect(command.reason).toBeDefined();
    });

    it('should maintain object references', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.productionVolumes).toBe(validProductionVolumes);
      expect(command.revenueBreakdown).toBe(validRevenueBreakdown);
    });
  });

  describe('production volumes structure', () => {
    it('should validate production volumes structure', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.productionVolumes.oilVolume).toBe(1000);
      expect(command.productionVolumes.gasVolume).toBe(5000);
    });

    it('should handle undefined production volumes', () => {
      const volumesWithUndefined = {
        oilVolume: 1000,
        gasVolume: undefined,
      };

      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        volumesWithUndefined,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.productionVolumes.oilVolume).toBe(1000);
      expect(command.productionVolumes.gasVolume).toBeUndefined();
    });
  });

  describe('revenue breakdown structure', () => {
    it('should validate revenue breakdown structure', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      expect(command.revenueBreakdown.oilRevenue).toBe(50000);
      expect(command.revenueBreakdown.gasRevenue).toBe(25000);
      expect(command.revenueBreakdown.totalRevenue).toBe(75000);
      expect(command.revenueBreakdown.netRevenue).toBe(60000);
    });

    it('should handle undefined optional revenue fields', () => {
      const breakdownWithUndefined = {
        totalRevenue: 75000,
        netRevenue: 60000,
      };

      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        breakdownWithUndefined,
        validCalculatedBy,
      );

      expect(command.revenueBreakdown.totalRevenue).toBe(75000);
      expect(command.revenueBreakdown.netRevenue).toBe(60000);
      expect(command.revenueBreakdown.oilRevenue).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero values in volumes and breakdown', () => {
      const zeroVolumes = {
        oilVolume: 0,
        gasVolume: 0,
      };
      const zeroBreakdown = {
        totalRevenue: 0,
        netRevenue: 0,
      };

      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        zeroVolumes,
        zeroBreakdown,
        validCalculatedBy,
      );

      expect(command.productionVolumes.oilVolume).toBe(0);
      expect(command.revenueBreakdown.totalRevenue).toBe(0);
    });

    it('should handle empty reason', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
        '',
      );

      expect(command.reason).toBe('');
    });

    it('should handle undefined reason', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
        undefined,
      );

      expect(command.reason).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new RecalculateRevenueDistributionCommand(
        validRevenueDistributionId,
        validProductionVolumes,
        validRevenueBreakdown,
        validCalculatedBy,
      );

      const id1 = command.revenueDistributionId;
      const id2 = command.revenueDistributionId;
      const volumes1 = command.productionVolumes;
      const volumes2 = command.productionVolumes;

      expect(id1).toBe(id2);
      expect(volumes1).toBe(volumes2);
    });
  });
});
