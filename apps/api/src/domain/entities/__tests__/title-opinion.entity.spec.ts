import {
  TitleOpinion,
  TitleStatus,
  TitleOpinionProps,
} from '../title-opinion.entity';

describe('TitleOpinion Entity', () => {
  const validProps: TitleOpinionProps = {
    id: 'title-123',
    organizationId: 'org-456',
    leaseId: 'lease-789',
    opinionNumber: 'TO-2024-001',
    examinerName: 'John Doe',
    examinationDate: new Date('2024-01-15'),
    effectiveDate: new Date('2024-01-01'),
    titleStatus: TitleStatus.CLEAR,
    findings: 'Title is clear with no defects',
    recommendations: 'Proceed with operations',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    version: 1,
  };

  describe('Constructor', () => {
    it('should create title opinion with required fields', () => {
      const minimalProps: TitleOpinionProps = {
        id: 'title-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        opinionNumber: 'TO-2024-001',
        examinerName: 'John Doe',
        examinationDate: new Date('2024-01-15'),
        effectiveDate: new Date('2024-01-01'),
        titleStatus: TitleStatus.CLEAR,
      };

      const titleOpinion = new TitleOpinion(minimalProps);

      expect(titleOpinion.getId()).toBe('title-123');
      expect(titleOpinion.getOrganizationId()).toBe('org-456');
      expect(titleOpinion.getLeaseId()).toBe('lease-789');
      expect(titleOpinion.getOpinionNumber()).toBe('TO-2024-001');
      expect(titleOpinion.getExaminerName()).toBe('John Doe');
      expect(titleOpinion.getExaminationDate()).toEqual(new Date('2024-01-15'));
      expect(titleOpinion.getEffectiveDate()).toEqual(new Date('2024-01-01'));
      expect(titleOpinion.getTitleStatus()).toBe(TitleStatus.CLEAR);
    });

    it('should create title opinion with all optional fields', () => {
      const titleOpinion = new TitleOpinion(validProps);

      expect(titleOpinion.getFindings()).toBe('Title is clear with no defects');
      expect(titleOpinion.getRecommendations()).toBe('Proceed with operations');
    });

    it('should set default values for optional fields', () => {
      const minimalProps: TitleOpinionProps = {
        id: 'title-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        opinionNumber: 'TO-2024-001',
        examinerName: 'John Doe',
        examinationDate: new Date('2024-01-15'),
        effectiveDate: new Date('2024-01-01'),
        titleStatus: TitleStatus.CLEAR,
      };

      const titleOpinion = new TitleOpinion(minimalProps);

      expect(titleOpinion.getFindings()).toBeUndefined();
      expect(titleOpinion.getRecommendations()).toBeUndefined();
    });

    it('should create copies of date objects to prevent external mutation', () => {
      const originalExaminationDate = new Date(2024, 0, 15); // January 15, 2024
      const originalEffectiveDate = new Date(2024, 0, 1); // January 1, 2024

      const props: TitleOpinionProps = {
        ...validProps,
        examinationDate: originalExaminationDate,
        effectiveDate: originalEffectiveDate,
      };

      const titleOpinion = new TitleOpinion(props);

      // Modify original dates
      originalExaminationDate.setFullYear(2023);
      originalEffectiveDate.setMonth(0); // January

      // Entity dates should remain unchanged
      expect(titleOpinion.getExaminationDate().getFullYear()).toBe(2024);
      expect(titleOpinion.getEffectiveDate().getMonth()).toBe(0); // January
    });

    it('should throw error for invalid title status', () => {
      const invalidProps: TitleOpinionProps = {
        ...validProps,
        titleStatus: 'invalid' as TitleStatus,
      };

      expect(() => new TitleOpinion(invalidProps)).toThrow(
        'Invalid title status',
      );
    });
  });

  describe('Getters', () => {
    let titleOpinion: TitleOpinion;

    beforeEach(() => {
      titleOpinion = new TitleOpinion(validProps);
    });

    it('should return correct id', () => {
      expect(titleOpinion.getId()).toBe('title-123');
    });

    it('should return correct organizationId', () => {
      expect(titleOpinion.getOrganizationId()).toBe('org-456');
    });

    it('should return correct leaseId', () => {
      expect(titleOpinion.getLeaseId()).toBe('lease-789');
    });

    it('should return correct opinionNumber', () => {
      expect(titleOpinion.getOpinionNumber()).toBe('TO-2024-001');
    });

    it('should return correct examinerName', () => {
      expect(titleOpinion.getExaminerName()).toBe('John Doe');
    });

    it('should return correct examinationDate', () => {
      expect(titleOpinion.getExaminationDate()).toEqual(new Date('2024-01-15'));
    });

    it('should return correct effectiveDate', () => {
      expect(titleOpinion.getEffectiveDate()).toEqual(new Date('2024-01-01'));
    });

    it('should return correct titleStatus', () => {
      expect(titleOpinion.getTitleStatus()).toBe(TitleStatus.CLEAR);
    });

    it('should return correct findings', () => {
      expect(titleOpinion.getFindings()).toBe('Title is clear with no defects');
    });

    it('should return correct recommendations', () => {
      expect(titleOpinion.getRecommendations()).toBe('Proceed with operations');
    });

    it('should return copies of dates to prevent external mutation', () => {
      const returnedExaminationDate = titleOpinion.getExaminationDate();
      const returnedEffectiveDate = titleOpinion.getEffectiveDate();

      returnedExaminationDate.setFullYear(2023);
      returnedEffectiveDate.setMonth(5); // June

      // Entity dates should remain unchanged
      expect(titleOpinion.getExaminationDate().getFullYear()).toBe(2024);
      expect(titleOpinion.getEffectiveDate().getMonth()).toBe(11); // December
    });
  });

  describe('Business Methods', () => {
    let titleOpinion: TitleOpinion;

    beforeEach(() => {
      titleOpinion = new TitleOpinion(validProps);
    });

    describe('updateStatus', () => {
      it('should update title status', () => {
        titleOpinion.updateStatus(TitleStatus.DEFECTIVE);

        expect(titleOpinion.getTitleStatus()).toBe(TitleStatus.DEFECTIVE);
      });

      it('should throw error for invalid status', () => {
        expect(() =>
          titleOpinion.updateStatus('invalid' as TitleStatus),
        ).toThrow('Invalid title status');
      });
    });

    describe('updateFindings', () => {
      it('should update findings and recommendations', () => {
        titleOpinion.updateFindings({
          findings: 'New findings',
          recommendations: 'New recommendations',
        });

        expect(titleOpinion.getFindings()).toBe('New findings');
        expect(titleOpinion.getRecommendations()).toBe('New recommendations');
      });

      it('should update findings only', () => {
        titleOpinion.updateFindings({ findings: 'New findings' });

        expect(titleOpinion.getFindings()).toBe('New findings');
        expect(titleOpinion.getRecommendations()).toBe(
          'Proceed with operations',
        );
      });

      it('should update recommendations only', () => {
        titleOpinion.updateFindings({ recommendations: 'New recommendations' });

        expect(titleOpinion.getFindings()).toBe(
          'Title is clear with no defects',
        );
        expect(titleOpinion.getRecommendations()).toBe('New recommendations');
      });

      it('should clear findings and recommendations', () => {
        titleOpinion.updateFindings({
          findings: undefined,
          recommendations: undefined,
        });

        expect(titleOpinion.getFindings()).toBeUndefined();
        expect(titleOpinion.getRecommendations()).toBeUndefined();
      });
    });
  });

  describe('TitleStatus Enum', () => {
    it('should have all required status values', () => {
      expect(TitleStatus.CLEAR).toBe('clear');
      expect(TitleStatus.DEFECTIVE).toBe('defective');
      expect(TitleStatus.PENDING).toBe('pending');
    });
  });
});
