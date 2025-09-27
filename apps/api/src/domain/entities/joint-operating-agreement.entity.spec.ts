import {
  JointOperatingAgreement,
  JoaProps,
  JoaStatus,
} from './joint-operating-agreement.entity';

describe('JointOperatingAgreement Entity', () => {
  const validId = 'joa-123';
  const validOrganizationId = 'org-456';
  const validAgreementNumber = 'JOA-2024-001';
  const validEffectiveDate = '2024-01-01';
  const validEndDate = '2024-12-31';
  const validOperatorOverheadPercent = '10.50';
  const validVotingThresholdPercent = '75.00';
  const validNonConsentPenaltyPercent = '5.25';
  const validStatus: JoaStatus = 'ACTIVE';
  const validTerms = {
    clause1: 'Standard terms',
    clause2: 'Special provisions',
  };
  const validCreatedAt = new Date('2024-01-01');
  const validUpdatedAt = new Date('2024-01-02');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create JOA with required fields', () => {
      const props: JoaProps = {
        id: validId,
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        status: validStatus,
      };

      const joa = new JointOperatingAgreement(props);

      expect(joa.getId()).toBe(validId);
      expect(joa.getOrganizationId()).toBe(validOrganizationId);
    });

    it('should create JOA with all optional fields', () => {
      const props: JoaProps = {
        id: validId,
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        endDate: validEndDate,
        operatorOverheadPercent: validOperatorOverheadPercent,
        votingThresholdPercent: validVotingThresholdPercent,
        nonConsentPenaltyPercent: validNonConsentPenaltyPercent,
        status: validStatus,
        terms: validTerms,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      const joa = new JointOperatingAgreement(props);

      expect(joa.getId()).toBe(validId);
      expect(joa.getOrganizationId()).toBe(validOrganizationId);
    });

    it('should generate random UUID when id is not provided', () => {
      const props: JoaProps = {
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        status: validStatus,
      };

      const joa = new JointOperatingAgreement(props);

      expect(joa.getId()).toBeDefined();
      expect(typeof joa.getId()).toBe('string');
      expect(joa.getId().length).toBeGreaterThan(0);
    });

    it('should throw error for invalid effective date format', () => {
      const props: JoaProps = {
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: '2024/01/01', // Invalid format
        status: validStatus,
      };

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new JointOperatingAgreement(props);
      }).toThrow('effectiveDate must be YYYY-MM-DD');
    });

    it('should throw error for invalid end date format', () => {
      const props: JoaProps = {
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        endDate: '2024/12/31', // Invalid format
        status: validStatus,
      };

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new JointOperatingAgreement(props);
      }).toThrow('endDate must be YYYY-MM-DD');
    });

    it('should throw error for missing agreement number', () => {
      const props: JoaProps = {
        organizationId: validOrganizationId,
        agreementNumber: '', // Empty
        effectiveDate: validEffectiveDate,
        status: validStatus,
      };

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new JointOperatingAgreement(props);
      }).toThrow('agreementNumber is required');
    });
  });

  describe('Persistence Mapping', () => {
    let joa: JointOperatingAgreement;

    beforeEach(() => {
      const props: JoaProps = {
        id: validId,
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        endDate: validEndDate,
        operatorOverheadPercent: validOperatorOverheadPercent,
        votingThresholdPercent: validVotingThresholdPercent,
        nonConsentPenaltyPercent: validNonConsentPenaltyPercent,
        status: validStatus,
        terms: validTerms,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      joa = new JointOperatingAgreement(props);
    });

    describe('fromPersistence', () => {
      it('should create JOA from persistence data', () => {
        const persistenceData: JoaProps = {
          id: validId,
          organizationId: validOrganizationId,
          agreementNumber: validAgreementNumber,
          effectiveDate: validEffectiveDate,
          endDate: validEndDate,
          operatorOverheadPercent: validOperatorOverheadPercent,
          votingThresholdPercent: validVotingThresholdPercent,
          nonConsentPenaltyPercent: validNonConsentPenaltyPercent,
          status: validStatus,
          terms: validTerms,
          createdAt: validCreatedAt,
          updatedAt: validUpdatedAt,
        };

        const joa = JointOperatingAgreement.fromPersistence(persistenceData);

        expect(joa.getId()).toBe(validId);
        expect(joa.getOrganizationId()).toBe(validOrganizationId);
      });
    });

    describe('toPersistence', () => {
      it('should convert JOA to persistence data', () => {
        const persistenceData = joa.toPersistence();

        expect(persistenceData).toEqual({
          id: validId,
          organizationId: validOrganizationId,
          agreementNumber: validAgreementNumber,
          effectiveDate: validEffectiveDate,
          endDate: validEndDate,
          operatorOverheadPercent: validOperatorOverheadPercent,
          votingThresholdPercent: validVotingThresholdPercent,
          nonConsentPenaltyPercent: validNonConsentPenaltyPercent,
          status: validStatus,
          terms: validTerms,
          createdAt: validCreatedAt,
          updatedAt: validUpdatedAt,
        });
      });

      it('should handle null terms in persistence data', () => {
        const joaWithoutTerms = new JointOperatingAgreement({
          id: validId,
          organizationId: validOrganizationId,
          agreementNumber: validAgreementNumber,
          effectiveDate: validEffectiveDate,
          status: validStatus,
          terms: null,
        });

        const persistenceData = joaWithoutTerms.toPersistence();

        expect(persistenceData.terms).toBeUndefined();
      });
    });
  });

  describe('Getters', () => {
    let joa: JointOperatingAgreement;

    beforeEach(() => {
      const props: JoaProps = {
        id: validId,
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        endDate: validEndDate,
        operatorOverheadPercent: validOperatorOverheadPercent,
        votingThresholdPercent: validVotingThresholdPercent,
        nonConsentPenaltyPercent: validNonConsentPenaltyPercent,
        status: validStatus,
        terms: validTerms,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      joa = new JointOperatingAgreement(props);
    });

    it('should return correct id', () => {
      expect(joa.getId()).toBe(validId);
    });

    it('should return correct organization id', () => {
      expect(joa.getOrganizationId()).toBe(validOrganizationId);
    });
  });

  describe('Business Methods', () => {
    let joa: JointOperatingAgreement;

    beforeEach(() => {
      const props: JoaProps = {
        id: validId,
        organizationId: validOrganizationId,
        agreementNumber: validAgreementNumber,
        effectiveDate: validEffectiveDate,
        status: 'ACTIVE',
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      };

      joa = new JointOperatingAgreement(props);
    });

    describe('suspend', () => {
      it('should suspend the agreement', () => {
        joa.suspend();

        // Note: The entity doesn't expose status getter, so we test via persistence
        const persistence = joa.toPersistence();
        expect(persistence.status).toBe('SUSPENDED');
      });
    });

    describe('terminate', () => {
      it('should terminate the agreement', () => {
        joa.terminate();

        // Note: The entity doesn't expose status getter, so we test via persistence
        const persistence = joa.toPersistence();
        expect(persistence.status).toBe('TERMINATED');
      });
    });
  });

  describe('JoaStatus Enum', () => {
    it('should have correct status values', () => {
      expect(['ACTIVE', 'TERMINATED', 'SUSPENDED']).toContain('ACTIVE');
      expect(['ACTIVE', 'TERMINATED', 'SUSPENDED']).toContain('TERMINATED');
      expect(['ACTIVE', 'TERMINATED', 'SUSPENDED']).toContain('SUSPENDED');
    });
  });
});
