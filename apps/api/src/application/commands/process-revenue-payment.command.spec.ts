import { ProcessRevenuePaymentCommand } from './process-revenue-payment.command';

describe('ProcessRevenuePaymentCommand', () => {
  const validRevenueDistributionId = 'dist-123';
  const validCheckNumber = 'CHK-2024-001';
  const validPaymentDate = new Date('2024-03-15');
  const validProcessedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        validCheckNumber,
        validPaymentDate,
        validProcessedBy,
      );

      expect(command.revenueDistributionId).toBe(validRevenueDistributionId);
      expect(command.checkNumber).toBe(validCheckNumber);
      expect(command.paymentDate).toBe(validPaymentDate);
      expect(command.processedBy).toBe(validProcessedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        validCheckNumber,
        validPaymentDate,
        validProcessedBy,
      );

      expect(command.revenueDistributionId).toBeDefined();
      expect(command.checkNumber).toBeDefined();
      expect(command.paymentDate).toBeDefined();
      expect(command.processedBy).toBeDefined();
    });

    it('should maintain date reference for paymentDate', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        validCheckNumber,
        validPaymentDate,
        validProcessedBy,
      );

      expect(command.paymentDate).toBe(validPaymentDate);
    });
  });

  describe('edge cases', () => {
    it('should handle empty check number', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        '',
        validPaymentDate,
        validProcessedBy,
      );

      expect(command.checkNumber).toBe('');
    });

    it('should handle empty processed by', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        validCheckNumber,
        validPaymentDate,
        '',
      );

      expect(command.processedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new ProcessRevenuePaymentCommand(
        validRevenueDistributionId,
        validCheckNumber,
        validPaymentDate,
        validProcessedBy,
      );

      const id1 = command.revenueDistributionId;
      const id2 = command.revenueDistributionId;
      const date1 = command.paymentDate;
      const date2 = command.paymentDate;

      expect(id1).toBe(id2);
      expect(date1).toBe(date2);
    });
  });
});
