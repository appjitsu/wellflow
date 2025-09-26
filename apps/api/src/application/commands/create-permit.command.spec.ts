import { CreatePermitCommand } from './create-permit.command';

describe('CreatePermitCommand', () => {
  const validPermitNumber = 'PERM-2024-001';
  const validPermitType = 'drilling';
  const validOrganizationId = 'org-123';
  const validIssuingAgency = 'State Oil Commission';
  const validCreatedByUserId = 'user-456';
  const validWellId = 'well-789';
  const validRegulatoryAuthority = 'EPA';
  const validApplicationDate = new Date('2024-01-15');
  const validExpirationDate = new Date('2025-01-15');
  const validPermitConditions = { condition1: 'value1', condition2: 'value2' };
  const validComplianceRequirements = { req1: 'desc1', req2: 'desc2' };
  const validFeeAmount = 2500;
  const validBondAmount = 50000;
  const validBondType = 'surety';
  const validLocation = 'Well Site A';
  const validFacilityId = 'facility-101';
  const validDocumentIds = ['doc-1', 'doc-2', 'doc-3'];

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
      );

      expect(command.permitNumber).toBe(validPermitNumber);
      expect(command.permitType).toBe(validPermitType);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.issuingAgency).toBe(validIssuingAgency);
      expect(command.createdByUserId).toBe(validCreatedByUserId);
      expect(command.wellId).toBeUndefined();
      expect(command.regulatoryAuthority).toBeUndefined();
      expect(command.applicationDate).toBeUndefined();
      expect(command.expirationDate).toBeUndefined();
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
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        validWellId,
        validRegulatoryAuthority,
        validApplicationDate,
        validExpirationDate,
        validPermitConditions,
        validComplianceRequirements,
        validFeeAmount,
        validBondAmount,
        validBondType,
        validLocation,
        validFacilityId,
        validDocumentIds,
      );

      expect(command.permitNumber).toBe(validPermitNumber);
      expect(command.permitType).toBe(validPermitType);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.issuingAgency).toBe(validIssuingAgency);
      expect(command.createdByUserId).toBe(validCreatedByUserId);
      expect(command.wellId).toBe(validWellId);
      expect(command.regulatoryAuthority).toBe(validRegulatoryAuthority);
      expect(command.applicationDate).toBe(validApplicationDate);
      expect(command.expirationDate).toBe(validExpirationDate);
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
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        validWellId,
        undefined,
        validApplicationDate,
        undefined,
        validPermitConditions,
        undefined,
        validFeeAmount,
      );

      expect(command.permitNumber).toBe(validPermitNumber);
      expect(command.wellId).toBe(validWellId);
      expect(command.regulatoryAuthority).toBeUndefined();
      expect(command.applicationDate).toBe(validApplicationDate);
      expect(command.expirationDate).toBeUndefined();
      expect(command.permitConditions).toEqual(validPermitConditions);
      expect(command.complianceRequirements).toBeUndefined();
      expect(command.feeAmount).toBe(validFeeAmount);
      expect(command.bondAmount).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        validWellId,
      );

      expect(command.permitNumber).toBeDefined();
      expect(command.permitType).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.issuingAgency).toBeDefined();
      expect(command.createdByUserId).toBeDefined();
      expect(command.wellId).toBeDefined();
    });

    it('should maintain object references for complex properties', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        validWellId,
        validRegulatoryAuthority,
        validApplicationDate,
        validExpirationDate,
        validPermitConditions,
        validComplianceRequirements,
        validFeeAmount,
        validBondAmount,
        validBondType,
        validLocation,
        validFacilityId,
        validDocumentIds,
      );

      expect(command.applicationDate).toBe(validApplicationDate);
      expect(command.expirationDate).toBe(validExpirationDate);
      expect(command.permitConditions).toBe(validPermitConditions);
      expect(command.complianceRequirements).toBe(validComplianceRequirements);
      expect(command.documentIds).toBe(validDocumentIds);
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays for documentIds', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
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
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        {},
        {},
      );

      expect(command.permitConditions).toEqual({});
      expect(command.complianceRequirements).toEqual({});
    });

    it('should handle zero values for numeric properties', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        0,
      );

      expect(command.feeAmount).toBe(0);
      expect(command.bondAmount).toBe(0);
    });

    it('should handle empty strings for string properties', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        '',
        '',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '',
        '',
        '',
      );

      expect(command.wellId).toBe('');
      expect(command.regulatoryAuthority).toBe('');
      expect(command.bondType).toBe('');
      expect(command.location).toBe('');
      expect(command.facilityId).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(command.wellId).toBeUndefined();
      expect(command.regulatoryAuthority).toBeUndefined();
      expect(command.applicationDate).toBeUndefined();
      expect(command.expirationDate).toBeUndefined();
      expect(command.permitConditions).toBeUndefined();
      expect(command.complianceRequirements).toBeUndefined();
      expect(command.feeAmount).toBeUndefined();
      expect(command.bondAmount).toBeUndefined();
      expect(command.bondType).toBeUndefined();
      expect(command.location).toBeUndefined();
      expect(command.facilityId).toBeUndefined();
      expect(command.documentIds).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreatePermitCommand(
        validPermitNumber,
        validPermitType,
        validOrganizationId,
        validIssuingAgency,
        validCreatedByUserId,
      );

      const permitNumber1 = command.permitNumber;
      const permitNumber2 = command.permitNumber;
      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;

      expect(permitNumber1).toBe(permitNumber2);
      expect(orgId1).toBe(orgId2);
    });
  });
});
