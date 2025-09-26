import {
  UpdateVendorInsuranceCommand,
  UpdateVendorInsuranceData,
} from './update-vendor-insurance.command';

describe('UpdateVendorInsuranceCommand', () => {
  const validVendorId = 'vendor-123';
  const validGeneralLiability = {
    carrier: 'ABC Insurance',
    policyNumber: 'GL-2024-001',
    coverageAmount: 1000000,
    expirationDate: new Date('2025-03-15'),
  };
  const validWorkersCompensation = {
    carrier: 'XYZ Insurance',
    policyNumber: 'WC-2024-002',
    coverageAmount: 500000,
    expirationDate: new Date('2025-06-01'),
  };
  const validAutoLiability = {
    carrier: 'DEF Insurance',
    policyNumber: 'AL-2024-003',
    coverageAmount: 750000,
    expirationDate: new Date('2025-09-15'),
  };
  const validInsurance: UpdateVendorInsuranceData = {
    generalLiability: validGeneralLiability,
    workersCompensation: validWorkersCompensation,
    autoLiability: validAutoLiability,
  };
  const validUpdatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const minimalInsurance: UpdateVendorInsuranceData = {
        generalLiability: validGeneralLiability,
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        minimalInsurance,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.insurance).toEqual(minimalInsurance);
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        validInsurance,
        validUpdatedBy,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.insurance).toEqual(validInsurance);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });

    it('should create a command with full insurance data', () => {
      const fullInsurance: UpdateVendorInsuranceData = {
        generalLiability: validGeneralLiability,
        workersCompensation: validWorkersCompensation,
        autoLiability: validAutoLiability,
        professionalLiability: {
          carrier: 'GHI Insurance',
          policyNumber: 'PL-2024-004',
          coverageAmount: 2000000,
          expirationDate: new Date('2025-12-01'),
        },
        environmentalLiability: {
          carrier: 'JKL Insurance',
          policyNumber: 'EL-2024-005',
          coverageAmount: 1500000,
          expirationDate: new Date('2026-01-15'),
        },
        umbrella: {
          carrier: 'MNO Insurance',
          policyNumber: 'UM-2024-006',
          coverageAmount: 5000000,
          expirationDate: new Date('2026-03-01'),
        },
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        fullInsurance,
      );

      expect(command.insurance).toEqual(fullInsurance);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        validInsurance,
        validUpdatedBy,
      );

      expect(command.vendorId).toBeDefined();
      expect(command.insurance).toBeDefined();
      expect(command.updatedBy).toBeDefined();
    });

    it('should maintain object reference for insurance', () => {
      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        validInsurance,
      );

      expect(command.insurance).toBe(validInsurance);
    });
  });

  describe('InsurancePolicy structure', () => {
    it('should validate general liability policy structure', () => {
      const insurance: UpdateVendorInsuranceData = {
        generalLiability: validGeneralLiability,
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        insurance,
      );

      expect(command.insurance.generalLiability.carrier).toBe('ABC Insurance');
      expect(command.insurance.generalLiability.policyNumber).toBe(
        'GL-2024-001',
      );
      expect(command.insurance.generalLiability.coverageAmount).toBe(1000000);
      expect(command.insurance.generalLiability.expirationDate).toBe(
        validGeneralLiability.expirationDate,
      );
    });

    it('should validate optional insurance policies', () => {
      const insurance: UpdateVendorInsuranceData = {
        generalLiability: validGeneralLiability,
        workersCompensation: validWorkersCompensation,
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        insurance,
      );

      expect(command.insurance.workersCompensation).toEqual(
        validWorkersCompensation,
      );
      expect(command.insurance.autoLiability).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero coverage amounts', () => {
      const insuranceWithZero: UpdateVendorInsuranceData = {
        generalLiability: {
          ...validGeneralLiability,
          coverageAmount: 0,
        },
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        insuranceWithZero,
      );

      expect(command.insurance.generalLiability.coverageAmount).toBe(0);
    });

    it('should handle empty strings in policies', () => {
      const insuranceWithEmpty: UpdateVendorInsuranceData = {
        generalLiability: {
          carrier: '',
          policyNumber: '',
          coverageAmount: 1000000,
          expirationDate: new Date(),
        },
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        insuranceWithEmpty,
      );

      expect(command.insurance.generalLiability.carrier).toBe('');
      expect(command.insurance.generalLiability.policyNumber).toBe('');
    });

    it('should handle undefined optional policies', () => {
      const insuranceMinimal: UpdateVendorInsuranceData = {
        generalLiability: validGeneralLiability,
      };

      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        insuranceMinimal,
      );

      expect(command.insurance.workersCompensation).toBeUndefined();
      expect(command.insurance.autoLiability).toBeUndefined();
      expect(command.insurance.professionalLiability).toBeUndefined();
      expect(command.insurance.environmentalLiability).toBeUndefined();
      expect(command.insurance.umbrella).toBeUndefined();
    });

    it('should handle empty string for updatedBy', () => {
      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        validInsurance,
        '',
      );

      expect(command.updatedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateVendorInsuranceCommand(
        validVendorId,
        validInsurance,
      );

      const vendorId1 = command.vendorId;
      const vendorId2 = command.vendorId;
      const insurance1 = command.insurance;
      const insurance2 = command.insurance;

      expect(vendorId1).toBe(vendorId2);
      expect(insurance1).toBe(insurance2);
    });
  });
});
