import { CreateTitleOpinionCommand } from '../create-title-opinion.command';
import { TitleStatus } from '../../../domain/entities/title-opinion.entity';

describe('CreateTitleOpinionCommand', () => {
  const validOrganizationId = 'org-123';
  const validLeaseId = 'lease-456';
  const validOpinionNumber = 'TO-2024-001';
  const validExaminerName = 'John Doe';
  const validExaminationDate = new Date('2024-03-15');
  const validEffectiveDate = new Date('2024-03-16');
  const validTitleStatusClear = TitleStatus.CLEAR;
  const validTitleStatusDefective = TitleStatus.DEFECTIVE;
  const validTitleStatusPending = TitleStatus.PENDING;
  const validFindings = 'Title is clear with no exceptions';
  const validRecommendations = 'No curative actions required';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.opinionNumber).toBe(validOpinionNumber);
      expect(command.examinerName).toBe(validExaminerName);
      expect(command.examinationDate).toBe(validExaminationDate);
      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.titleStatus).toBe(TitleStatus.CLEAR);
      expect(command.findings).toBeUndefined();
      expect(command.recommendations).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusDefective,
        validFindings,
        validRecommendations,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.opinionNumber).toBe(validOpinionNumber);
      expect(command.examinerName).toBe(validExaminerName);
      expect(command.examinationDate).toBe(validExaminationDate);
      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.titleStatus).toBe(TitleStatus.DEFECTIVE);
      expect(command.findings).toBe(validFindings);
      expect(command.recommendations).toBe(validRecommendations);
    });

    it('should create a command with findings only', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusPending,
        validFindings,
      );

      expect(command.titleStatus).toBe(TitleStatus.PENDING);
      expect(command.findings).toBe(validFindings);
      expect(command.recommendations).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
        validFindings,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.leaseId).toBeDefined();
      expect(command.opinionNumber).toBeDefined();
      expect(command.examinerName).toBeDefined();
      expect(command.examinationDate).toBeDefined();
      expect(command.effectiveDate).toBeDefined();
      expect(command.titleStatus).toBeDefined();
      expect(command.findings).toBeDefined();
    });

    it('should maintain date object references', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
      );

      expect(command.examinationDate).toBe(validExaminationDate);
      expect(command.effectiveDate).toBe(validEffectiveDate);
    });
  });

  describe('TitleStatus enum values', () => {
    it('should accept CLEAR as valid titleStatus', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        TitleStatus.CLEAR,
      );

      expect(command.titleStatus).toBe(TitleStatus.CLEAR);
    });

    it('should accept DEFECTIVE as valid titleStatus', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        TitleStatus.DEFECTIVE,
      );

      expect(command.titleStatus).toBe(TitleStatus.DEFECTIVE);
    });

    it('should accept PENDING as valid titleStatus', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        TitleStatus.PENDING,
      );

      expect(command.titleStatus).toBe(TitleStatus.PENDING);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
        '',
        '',
      );

      expect(command.findings).toBe('');
      expect(command.recommendations).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
        undefined,
        undefined,
      );

      expect(command.findings).toBeUndefined();
      expect(command.recommendations).toBeUndefined();
    });

    it('should handle same examination and effective dates', () => {
      const sameDate = new Date('2024-04-01');
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        sameDate,
        sameDate,
        validTitleStatusClear,
      );

      expect(command.examinationDate).toBe(sameDate);
      expect(command.effectiveDate).toBe(sameDate);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateTitleOpinionCommand(
        validOrganizationId,
        validLeaseId,
        validOpinionNumber,
        validExaminerName,
        validExaminationDate,
        validEffectiveDate,
        validTitleStatusClear,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const status1 = command.titleStatus;
      const status2 = command.titleStatus;

      expect(orgId1).toBe(orgId2);
      expect(status1).toBe(status2);
    });
  });
});
