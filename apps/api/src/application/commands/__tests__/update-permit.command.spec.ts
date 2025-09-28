import { UpdatePermitCommand } from '../update-permit.command';

describe('UpdatePermitCommand', () => {
  const validPermitId = 'permit-123';
  const validUpdatedByUserId = 'user-456';
  const validPermitConditions = { condition1: 'value1', condition2: 'value2' };
  const validComplianceRequirements = { req1: 'desc1', req2: 'desc2' };
  const validFeeAmount = 5000;
  const validBondAmount = 10000;
  const validBondType = 'surety';
  const validLocation = 'Well Site A';
  const validFacilityId = 'facility-789';
  const validDocumentIds = ['doc-1', 'doc-2'];

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
      );

      expect(command.permitId).toBe(validPermitId);
      expect(command.updatedByUserId).toBe(validUpdatedByUserId);
      expect(command.permitConditions).toBeUndefined();
      expect(command.complianceRequirements).toBeUndefined();
      expect(command.feeAmount).toBeUndefined();
      expect(command.bondAmount).toBeUndefined();
      expect(command.bondType).toBeUndefined();
      expect(command.location).toBeUndefined();
      expect(command.facilityId).toBeUndefined();
      expect(command.documentIds).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        validPermitConditions,
        validComplianceRequirements,
        validFeeAmount,
        validBondAmount,
        validBondType,
        validLocation,
        validFacilityId,
        validDocumentIds,
      );

      expect(command.permitId).toBe(validPermitId);
      expect(command.updatedByUserId).toBe(validUpdatedByUserId);
      expect(command.permitConditions).toEqual(validPermitConditions);
      expect(command.complianceRequirements).toEqual(
        validComplianceRequirements,
      );
      expect(command.feeAmount).toBe(validFeeAmount);
      expect(command.bondAmount).toBe(validBondAmount);
      expect(command.bondType).toBe(validBondType);
      expect(command.location).toBe(validLocation);
      expect(command.facilityId).toBe(validFacilityId);
      expect(command.documentIds).toEqual(validDocumentIds);
    });

    it('should create a command with some optional properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        validPermitConditions,
        undefined,
        validFeeAmount,
        undefined,
        validBondType,
      );

      expect(command.permitId).toBe(validPermitId);
      expect(command.updatedByUserId).toBe(validUpdatedByUserId);
      expect(command.permitConditions).toEqual(validPermitConditions);
      expect(command.complianceRequirements).toBeUndefined();
      expect(command.feeAmount).toBe(validFeeAmount);
      expect(command.bondAmount).toBeUndefined();
      expect(command.bondType).toBe(validBondType);
      expect(command.location).toBeUndefined();
      expect(command.facilityId).toBeUndefined();
      expect(command.documentIds).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        validPermitConditions,
      );

      expect(command.permitId).toBeDefined();
      expect(command.updatedByUserId).toBeDefined();
      expect(command.permitConditions).toBeDefined();
    });

    it('should maintain object references for complex properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        validPermitConditions,
        validComplianceRequirements,
        validFeeAmount,
        validBondAmount,
        validBondType,
        validLocation,
        validFacilityId,
        validDocumentIds,
      );

      expect(command.permitConditions).toBe(validPermitConditions);
      expect(command.complianceRequirements).toBe(validComplianceRequirements);
      expect(command.documentIds).toBe(validDocumentIds);
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays for documentIds', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        [],
      );

      expect(command.documentIds).toEqual([]);
    });

    it('should handle empty objects for permitConditions and complianceRequirements', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        {},
        {},
      );

      expect(command.permitConditions).toEqual({});
      expect(command.complianceRequirements).toEqual({});
    });

    it('should handle zero values for numeric properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        undefined,
        undefined,
        0,
        0,
      );

      expect(command.feeAmount).toBe(0);
      expect(command.bondAmount).toBe(0);
    });

    it('should handle empty strings for string properties', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        '',
        '',
        '',
      );

      expect(command.bondType).toBe('');
      expect(command.location).toBe('');
      expect(command.facilityId).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdatePermitCommand(
        validPermitId,
        validUpdatedByUserId,
        validPermitConditions,
      );

      const permitId1 = command.permitId;
      const permitId2 = command.permitId;
      const conditions1 = command.permitConditions;
      const conditions2 = command.permitConditions;

      expect(permitId1).toBe(permitId2);
      expect(conditions1).toBe(conditions2);
    });
  });
});
