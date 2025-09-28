import { CreateAfeCommand } from '../create-afe.command';
import { AfeType } from '../../../domain/enums/afe-status.enum';

describe('CreateAfeCommand', () => {
  const validOrganizationId = 'org-123';
  const validAfeNumber = 'AFE-2024-001';
  const validAfeType = AfeType.DRILLING;
  const validWellId = 'well-456';
  const validLeaseId = 'lease-789';
  const validTotalEstimatedCost = 150000;
  const validDescription = 'Drilling operations for Well #1';
  const validCreatedBy = 'user-101';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.afeNumber).toBe(validAfeNumber);
      expect(command.afeType).toBe(validAfeType);
      expect(command.wellId).toBeUndefined();
      expect(command.leaseId).toBeUndefined();
      expect(command.totalEstimatedCost).toBeUndefined();
      expect(command.description).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with all optional properties', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
        validWellId,
        validLeaseId,
        validTotalEstimatedCost,
        validDescription,
        validCreatedBy,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.afeNumber).toBe(validAfeNumber);
      expect(command.afeType).toBe(validAfeType);
      expect(command.wellId).toBe(validWellId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.totalEstimatedCost).toBe(validTotalEstimatedCost);
      expect(command.description).toBe(validDescription);
      expect(command.createdBy).toBe(validCreatedBy);
    });

    it('should create a command with minimal required properties', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.afeNumber).toBe(validAfeNumber);
      expect(command.afeType).toBe(validAfeType);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
      );

      // Properties should be accessible
      expect(command.organizationId).toBeDefined();
      expect(command.afeNumber).toBeDefined();
      expect(command.afeType).toBeDefined();
    });

    it('should maintain primitive values for simple properties', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
        validWellId,
        validLeaseId,
        validTotalEstimatedCost,
      );

      expect(command.wellId).toBe(validWellId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.totalEstimatedCost).toBe(validTotalEstimatedCost);
    });
  });

  describe('AfeType enum', () => {
    it('should have correct AFE type values', () => {
      expect(AfeType.DRILLING).toBe('drilling');
      expect(AfeType.COMPLETION).toBe('completion');
      expect(AfeType.WORKOVER).toBe('workover');
      expect(AfeType.FACILITY).toBe('facility');
    });
  });

  describe('edge cases', () => {
    it('should handle empty optional string values', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
        '', // empty wellId
        '', // empty leaseId
        undefined,
        '', // empty description
        '', // empty createdBy
      );

      expect(command.wellId).toBe('');
      expect(command.leaseId).toBe('');
      expect(command.description).toBe('');
      expect(command.createdBy).toBe('');
    });

    it('should handle zero total estimated cost', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
        validWellId,
        validLeaseId,
        0,
      );

      expect(command.totalEstimatedCost).toBe(0);
    });

    it('should handle negative total estimated cost', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
        validWellId,
        validLeaseId,
        -1000,
      );

      expect(command.totalEstimatedCost).toBe(-1000);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateAfeCommand(
        validOrganizationId,
        validAfeNumber,
        validAfeType,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const afeNumber1 = command.afeNumber;
      const afeNumber2 = command.afeNumber;

      expect(orgId1).toBe(orgId2);
      expect(afeNumber1).toBe(afeNumber2);
    });
  });
});
