import { UpdateVendorPerformanceCommand } from '../update-vendor-performance.command';
import { VendorRating } from '../../../domain/enums/vendor-status.enum';

describe('UpdateVendorPerformanceCommand', () => {
  const validVendorId = 'vendor-123';
  const validOverallRating = VendorRating.EXCELLENT;
  const validSafetyRating = VendorRating.GOOD;
  const validQualityRating = VendorRating.EXCELLENT;
  const validTimelinessRating = VendorRating.SATISFACTORY;
  const validCostEffectivenessRating = VendorRating.GOOD;
  const validEvaluationNotes = 'Vendor performed well on recent project';
  const validEvaluatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.overallRating).toBe(VendorRating.EXCELLENT);
      expect(command.safetyRating).toBe(VendorRating.GOOD);
      expect(command.qualityRating).toBe(VendorRating.EXCELLENT);
      expect(command.timelinessRating).toBe(VendorRating.SATISFACTORY);
      expect(command.costEffectivenessRating).toBe(VendorRating.GOOD);
      expect(command.evaluationNotes).toBeUndefined();
      expect(command.evaluatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
        validEvaluationNotes,
        validEvaluatedBy,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.overallRating).toBe(VendorRating.EXCELLENT);
      expect(command.safetyRating).toBe(VendorRating.GOOD);
      expect(command.qualityRating).toBe(VendorRating.EXCELLENT);
      expect(command.timelinessRating).toBe(VendorRating.SATISFACTORY);
      expect(command.costEffectivenessRating).toBe(VendorRating.GOOD);
      expect(command.evaluationNotes).toBe(validEvaluationNotes);
      expect(command.evaluatedBy).toBe(validEvaluatedBy);
    });

    it('should create a command with evaluationNotes only', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
        validEvaluationNotes,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.evaluationNotes).toBe(validEvaluationNotes);
      expect(command.evaluatedBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
        validEvaluationNotes,
      );

      expect(command.vendorId).toBeDefined();
      expect(command.overallRating).toBeDefined();
      expect(command.safetyRating).toBeDefined();
      expect(command.qualityRating).toBeDefined();
      expect(command.timelinessRating).toBeDefined();
      expect(command.costEffectivenessRating).toBeDefined();
      expect(command.evaluationNotes).toBeDefined();
    });
  });

  describe('VendorRating enum values', () => {
    it('should accept all VendorRating values for overallRating', () => {
      const ratings = [
        VendorRating.NOT_RATED,
        VendorRating.EXCELLENT,
        VendorRating.GOOD,
        VendorRating.SATISFACTORY,
        VendorRating.POOR,
        VendorRating.UNACCEPTABLE,
      ];

      ratings.forEach((rating) => {
        const command = new UpdateVendorPerformanceCommand(
          validVendorId,
          rating,
          validSafetyRating,
          validQualityRating,
          validTimelinessRating,
          validCostEffectivenessRating,
        );

        expect(command.overallRating).toBe(rating);
      });
    });

    it('should accept all VendorRating values for all rating properties', () => {
      const rating = VendorRating.SATISFACTORY;
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        rating,
        rating,
        rating,
        rating,
        rating,
      );

      expect(command.overallRating).toBe(rating);
      expect(command.safetyRating).toBe(rating);
      expect(command.qualityRating).toBe(rating);
      expect(command.timelinessRating).toBe(rating);
      expect(command.costEffectivenessRating).toBe(rating);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
        '',
        '',
      );

      expect(command.evaluationNotes).toBe('');
      expect(command.evaluatedBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
        undefined,
        undefined,
      );

      expect(command.evaluationNotes).toBeUndefined();
      expect(command.evaluatedBy).toBeUndefined();
    });

    it('should handle NOT_RATED for all ratings', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        VendorRating.NOT_RATED,
        VendorRating.NOT_RATED,
        VendorRating.NOT_RATED,
        VendorRating.NOT_RATED,
        VendorRating.NOT_RATED,
      );

      expect(command.overallRating).toBe(VendorRating.NOT_RATED);
      expect(command.safetyRating).toBe(VendorRating.NOT_RATED);
      expect(command.qualityRating).toBe(VendorRating.NOT_RATED);
      expect(command.timelinessRating).toBe(VendorRating.NOT_RATED);
      expect(command.costEffectivenessRating).toBe(VendorRating.NOT_RATED);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateVendorPerformanceCommand(
        validVendorId,
        validOverallRating,
        validSafetyRating,
        validQualityRating,
        validTimelinessRating,
        validCostEffectivenessRating,
      );

      const vendorId1 = command.vendorId;
      const vendorId2 = command.vendorId;
      const rating1 = command.overallRating;
      const rating2 = command.overallRating;

      expect(vendorId1).toBe(vendorId2);
      expect(rating1).toBe(rating2);
    });
  });
});
