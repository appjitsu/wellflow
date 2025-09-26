import { CreateWorkoverCommand } from './create-workover.command';
import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

describe('CreateWorkoverCommand', () => {
  const validOrganizationId = 'org-123';
  const validWellId = 'well-456';
  const validAfeId = 'afe-789';
  const validReason = 'Well optimization and efficiency improvement';
  const validStatus = WorkoverStatus.PLANNED;
  const validStartDate = '2024-02-15T08:00:00Z';
  const validEndDate = '2024-02-20T17:00:00Z';
  const validPreProductionSnapshot = { rate: '500 bpd', pressure: '2500 psi' };
  const validPostProductionSnapshot = { rate: '650 bpd', pressure: '2400 psi' };

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.options).toBeUndefined();
    });

    it('should create a command with all optional properties', () => {
      const options = {
        afeId: validAfeId,
        reason: validReason,
        status: validStatus,
        startDate: validStartDate,
        endDate: validEndDate,
        preProductionSnapshot: validPreProductionSnapshot,
        postProductionSnapshot: validPostProductionSnapshot,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.options).toEqual(options);
    });

    it('should create a command with partial options', () => {
      const options = {
        afeId: validAfeId,
        reason: validReason,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options?.afeId).toBe(validAfeId);
      expect(command.options?.reason).toBe(validReason);
      expect(command.options?.status).toBeUndefined();
      expect(command.options?.startDate).toBeUndefined();
      expect(command.options?.endDate).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
      );

      // Properties should be accessible
      expect(command.organizationId).toBeDefined();
      expect(command.wellId).toBeDefined();
    });

    it('should maintain object references for options', () => {
      const options = {
        afeId: validAfeId,
        reason: validReason,
        preProductionSnapshot: validPreProductionSnapshot,
        postProductionSnapshot: validPostProductionSnapshot,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options).toBe(options);
      expect(command.options?.preProductionSnapshot).toBe(
        validPreProductionSnapshot,
      );
      expect(command.options?.postProductionSnapshot).toBe(
        validPostProductionSnapshot,
      );
    });
  });

  describe('options structure', () => {
    it('should handle all option types', () => {
      const options = {
        afeId: validAfeId,
        reason: validReason,
        status: validStatus,
        startDate: validStartDate,
        endDate: validEndDate,
        preProductionSnapshot: validPreProductionSnapshot,
        postProductionSnapshot: validPostProductionSnapshot,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options?.afeId).toBe(validAfeId);
      expect(command.options?.reason).toBe(validReason);
      expect(command.options?.status).toBe(validStatus);
      expect(command.options?.startDate).toBe(validStartDate);
      expect(command.options?.endDate).toBe(validEndDate);
      expect(command.options?.preProductionSnapshot).toEqual(
        validPreProductionSnapshot,
      );
      expect(command.options?.postProductionSnapshot).toEqual(
        validPostProductionSnapshot,
      );
    });

    it('should handle undefined values in options', () => {
      const options = {
        afeId: undefined,
        reason: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
        preProductionSnapshot: undefined,
        postProductionSnapshot: undefined,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options?.afeId).toBeUndefined();
      expect(command.options?.reason).toBeUndefined();
      expect(command.options?.status).toBeUndefined();
      expect(command.options?.startDate).toBeUndefined();
      expect(command.options?.endDate).toBeUndefined();
      expect(command.options?.preProductionSnapshot).toBeUndefined();
      expect(command.options?.postProductionSnapshot).toBeUndefined();
    });
  });

  describe('WorkoverStatus enum', () => {
    it('should have correct workover status values', () => {
      expect(WorkoverStatus.PLANNED).toBeDefined();
      expect(WorkoverStatus.IN_PROGRESS).toBeDefined();
      expect(WorkoverStatus.COMPLETED).toBeDefined();
      expect(WorkoverStatus.CANCELLED).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const command = new CreateWorkoverCommand(
        '', // empty organizationId
        '', // empty wellId
      );

      expect(command.organizationId).toBe('');
      expect(command.wellId).toBe('');
    });

    it('should handle options with empty strings', () => {
      const options = {
        afeId: '',
        reason: '',
        startDate: '',
        endDate: '',
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options?.afeId).toBe('');
      expect(command.options?.reason).toBe('');
      expect(command.options?.startDate).toBe('');
      expect(command.options?.endDate).toBe('');
    });

    it('should handle complex snapshot objects', () => {
      const complexSnapshot = {
        production: { oil: 500, gas: 1000, water: 200 },
        pressure: { tubing: 2500, casing: 3000 },
        temperature: { surface: 80, bottom: 150 },
        metadata: { lastMeasurement: '2024-02-14T10:00:00Z' },
      };

      const options = {
        preProductionSnapshot: complexSnapshot,
      };

      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
        options,
      );

      expect(command.options?.preProductionSnapshot).toEqual(complexSnapshot);
      expect(
        (command.options?.preProductionSnapshot as any)?.production?.oil,
      ).toBe(500);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateWorkoverCommand(
        validOrganizationId,
        validWellId,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const wellId1 = command.wellId;
      const wellId2 = command.wellId;

      expect(orgId1).toBe(orgId2);
      expect(wellId1).toBe(wellId2);
    });
  });
});
