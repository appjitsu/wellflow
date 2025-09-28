import { SubmitDailyDrillingReportCommand } from '../submit-daily-drilling-report.command';

describe('SubmitDailyDrillingReportCommand', () => {
  const validId = 'report-123';

  describe('constructor', () => {
    it('should create a command with an id', () => {
      const command = new SubmitDailyDrillingReportCommand(validId);

      expect(command.id).toBe(validId);
    });

    it('should create a command with different id values', () => {
      const command1 = new SubmitDailyDrillingReportCommand('report-456');
      const command2 = new SubmitDailyDrillingReportCommand('report-789');

      expect(command1.id).toBe('report-456');
      expect(command2.id).toBe('report-789');
    });
  });

  describe('properties', () => {
    it('should have readonly id property', () => {
      const command = new SubmitDailyDrillingReportCommand(validId);

      expect(command.id).toBeDefined();
      expect(typeof command.id).toBe('string');
    });

    it('should maintain id value', () => {
      const command = new SubmitDailyDrillingReportCommand(validId);

      expect(command.id).toBe(validId);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string id', () => {
      const command = new SubmitDailyDrillingReportCommand('');

      expect(command.id).toBe('');
    });

    it('should handle long id strings', () => {
      const longId = 'a'.repeat(100);
      const command = new SubmitDailyDrillingReportCommand(longId);

      expect(command.id).toBe(longId);
      expect(command.id.length).toBe(100);
    });

    it('should handle id with special characters', () => {
      const specialId = 'report-123_special@test.com';
      const command = new SubmitDailyDrillingReportCommand(specialId);

      expect(command.id).toBe(specialId);
    });

    it('should handle numeric id strings', () => {
      const numericId = '123456';
      const command = new SubmitDailyDrillingReportCommand(numericId);

      expect(command.id).toBe(numericId);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent id value', () => {
      const command = new SubmitDailyDrillingReportCommand(validId);

      const id1 = command.id;
      const id2 = command.id;

      expect(id1).toBe(id2);
      expect(id1).toBe(validId);
    });
  });

  describe('equality', () => {
    it('should create equal commands with same id', () => {
      const command1 = new SubmitDailyDrillingReportCommand(validId);
      const command2 = new SubmitDailyDrillingReportCommand(validId);

      expect(command1.id).toBe(command2.id);
    });

    it('should create different commands with different ids', () => {
      const command1 = new SubmitDailyDrillingReportCommand('report-123');
      const command2 = new SubmitDailyDrillingReportCommand('report-456');

      expect(command1.id).not.toBe(command2.id);
    });
  });
});
