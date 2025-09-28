import { GenerateRegulatoryReportCommand } from '../generate-regulatory-report.command';

describe('GenerateRegulatoryReportCommand', () => {
  const validReportId = 'report-123';
  const validGeneratedByUserId = 'user-456';
  const validReportData = { data1: 'value1', data2: 42 };
  const validMetadata = { meta1: 'info1', meta2: true };

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.generatedByUserId).toBe(validGeneratedByUserId);
      expect(command.reportData).toBeUndefined();
      expect(command.metadata).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        validReportData,
        validMetadata,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.generatedByUserId).toBe(validGeneratedByUserId);
      expect(command.reportData).toEqual(validReportData);
      expect(command.metadata).toEqual(validMetadata);
    });

    it('should create a command with some optional properties', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        validReportData,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.generatedByUserId).toBe(validGeneratedByUserId);
      expect(command.reportData).toEqual(validReportData);
      expect(command.metadata).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        validReportData,
      );

      expect(command.reportId).toBeDefined();
      expect(command.generatedByUserId).toBeDefined();
      expect(command.reportData).toBeDefined();
    });

    it('should maintain object references for complex properties', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        validReportData,
        validMetadata,
      );

      expect(command.reportData).toBe(validReportData);
      expect(command.metadata).toBe(validMetadata);
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects for reportData and metadata', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        {},
        {},
      );

      expect(command.reportData).toEqual({});
      expect(command.metadata).toEqual({});
    });

    it('should handle undefined optional properties', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        undefined,
        undefined,
      );

      expect(command.reportData).toBeUndefined();
      expect(command.metadata).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new GenerateRegulatoryReportCommand(
        validReportId,
        validGeneratedByUserId,
        validReportData,
      );

      const reportId1 = command.reportId;
      const reportId2 = command.reportId;
      const data1 = command.reportData;
      const data2 = command.reportData;

      expect(reportId1).toBe(reportId2);
      expect(data1).toBe(data2);
    });
  });
});
