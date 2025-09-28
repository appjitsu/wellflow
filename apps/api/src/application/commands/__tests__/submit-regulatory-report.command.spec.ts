import { SubmitRegulatoryReportCommand } from '../submit-regulatory-report.command';

describe('SubmitRegulatoryReportCommand', () => {
  const validReportId = 'report-123';
  const validSubmittedByUserId = 'user-456';
  const validSubmissionMethod = 'electronic';
  const validExternalSubmissionId = 'ext-sub-789';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.submittedByUserId).toBe(validSubmittedByUserId);
      expect(command.submissionMethod).toBeUndefined();
      expect(command.externalSubmissionId).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        validSubmissionMethod,
        validExternalSubmissionId,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.submittedByUserId).toBe(validSubmittedByUserId);
      expect(command.submissionMethod).toBe(validSubmissionMethod);
      expect(command.externalSubmissionId).toBe(validExternalSubmissionId);
    });

    it('should create a command with some optional properties', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        validSubmissionMethod,
      );

      expect(command.reportId).toBe(validReportId);
      expect(command.submittedByUserId).toBe(validSubmittedByUserId);
      expect(command.submissionMethod).toBe(validSubmissionMethod);
      expect(command.externalSubmissionId).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        validSubmissionMethod,
      );

      expect(command.reportId).toBeDefined();
      expect(command.submittedByUserId).toBeDefined();
      expect(command.submissionMethod).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        '',
        '',
      );

      expect(command.submissionMethod).toBe('');
      expect(command.externalSubmissionId).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        undefined,
        undefined,
      );

      expect(command.submissionMethod).toBeUndefined();
      expect(command.externalSubmissionId).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new SubmitRegulatoryReportCommand(
        validReportId,
        validSubmittedByUserId,
        validSubmissionMethod,
      );

      const reportId1 = command.reportId;
      const reportId2 = command.reportId;

      expect(reportId1).toBe(reportId2);
    });
  });
});
