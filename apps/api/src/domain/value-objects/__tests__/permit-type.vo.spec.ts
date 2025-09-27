import { PermitType } from '../permit-type.vo';

describe('PermitType', () => {
  describe('static instances', () => {
    it('should have all predefined permit types', () => {
      expect(PermitType.DRILLING.value).toBe('drilling');
      expect(PermitType.COMPLETION.value).toBe('completion');
      expect(PermitType.WORKOVER.value).toBe('workover');
      expect(PermitType.INJECTION.value).toBe('injection');
      expect(PermitType.DISPOSAL.value).toBe('disposal');
      expect(PermitType.FACILITY.value).toBe('facility');
      expect(PermitType.PIPELINE.value).toBe('pipeline');
      expect(PermitType.ENVIRONMENTAL.value).toBe('environmental');
    });
  });

  describe('fromString', () => {
    it('should create permit type from valid string', () => {
      expect(PermitType.fromString('drilling')).toEqual(PermitType.DRILLING);
      expect(PermitType.fromString('completion')).toEqual(
        PermitType.COMPLETION,
      );
      expect(PermitType.fromString('environmental')).toEqual(
        PermitType.ENVIRONMENTAL,
      );
    });

    it('should throw error for invalid permit type', () => {
      expect(() => PermitType.fromString('invalid')).toThrow(
        'Invalid permit type: invalid',
      );
      expect(() => PermitType.fromString('')).toThrow('Invalid permit type: ');
    });
  });

  describe('create', () => {
    it('should create permit type from valid string', () => {
      const permitType = PermitType.create('drilling');
      expect(permitType.value).toBe('drilling');
    });

    it('should throw error for invalid permit type', () => {
      expect(() => PermitType.create('invalid')).toThrow(
        'Invalid permit type: invalid',
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal permit types', () => {
      const type1 = PermitType.DRILLING;
      const type2 = PermitType.fromString('drilling');
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different permit types', () => {
      expect(PermitType.DRILLING.equals(PermitType.COMPLETION)).toBe(false);
    });

    it('should return false for non-PermitType objects', () => {
      expect(PermitType.DRILLING.equals({} as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the string value', () => {
      expect(PermitType.DRILLING.toString()).toBe('drilling');
      expect(PermitType.ENVIRONMENTAL.toString()).toBe('environmental');
    });
  });

  describe('business logic methods', () => {
    describe('requiresEnvironmentalReview', () => {
      it('should return true for types requiring environmental review', () => {
        expect(PermitType.INJECTION.requiresEnvironmentalReview()).toBe(true);
        expect(PermitType.DISPOSAL.requiresEnvironmentalReview()).toBe(true);
        expect(PermitType.ENVIRONMENTAL.requiresEnvironmentalReview()).toBe(
          true,
        );
      });

      it('should return false for types not requiring environmental review', () => {
        expect(PermitType.DRILLING.requiresEnvironmentalReview()).toBe(false);
        expect(PermitType.FACILITY.requiresEnvironmentalReview()).toBe(false);
      });
    });

    describe('requiresWellAssociation', () => {
      it('should return true for types requiring well association', () => {
        expect(PermitType.DRILLING.requiresWellAssociation()).toBe(true);
        expect(PermitType.COMPLETION.requiresWellAssociation()).toBe(true);
        expect(PermitType.WORKOVER.requiresWellAssociation()).toBe(true);
        expect(PermitType.INJECTION.requiresWellAssociation()).toBe(true);
      });

      it('should return false for types not requiring well association', () => {
        expect(PermitType.FACILITY.requiresWellAssociation()).toBe(false);
        expect(PermitType.PIPELINE.requiresWellAssociation()).toBe(false);
        expect(PermitType.ENVIRONMENTAL.requiresWellAssociation()).toBe(false);
      });
    });

    describe('hasRenewalRequirements', () => {
      it('should return true for types with renewal requirements', () => {
        expect(PermitType.FACILITY.hasRenewalRequirements()).toBe(true);
        expect(PermitType.PIPELINE.hasRenewalRequirements()).toBe(true);
        expect(PermitType.DISPOSAL.hasRenewalRequirements()).toBe(true);
        expect(PermitType.INJECTION.hasRenewalRequirements()).toBe(true);
      });

      it('should return false for types without renewal requirements', () => {
        expect(PermitType.DRILLING.hasRenewalRequirements()).toBe(false);
        expect(PermitType.COMPLETION.hasRenewalRequirements()).toBe(false);
        expect(PermitType.WORKOVER.hasRenewalRequirements()).toBe(false);
      });
    });

    describe('getDefaultExpirationMonths', () => {
      it('should return correct expiration months for each type', () => {
        expect(PermitType.DRILLING.getDefaultExpirationMonths()).toBe(24);
        expect(PermitType.COMPLETION.getDefaultExpirationMonths()).toBe(12);
        expect(PermitType.WORKOVER.getDefaultExpirationMonths()).toBe(12);
        expect(PermitType.INJECTION.getDefaultExpirationMonths()).toBe(60);
        expect(PermitType.DISPOSAL.getDefaultExpirationMonths()).toBe(60);
        expect(PermitType.FACILITY.getDefaultExpirationMonths()).toBe(120);
        expect(PermitType.PIPELINE.getDefaultExpirationMonths()).toBe(120);
        expect(PermitType.ENVIRONMENTAL.getDefaultExpirationMonths()).toBe(60);
      });
    });
  });
});
