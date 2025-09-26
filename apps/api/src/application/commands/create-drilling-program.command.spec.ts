import { CreateDrillingProgramCommand } from './create-drilling-program.command';
import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';

describe('CreateDrillingProgramCommand', () => {
  const validOrganizationId = 'org-123';
  const validWellId = 'well-456';
  const validProgramName = 'Deep Well Drilling Program';
  const validAfeId = 'afe-789';
  const validStatus = DrillingProgramStatus.DRAFT;
  const validVersion = 1;
  const validProgram = {
    objectives: 'Drill to 8000ft TVD',
    methodology: 'Rotary drilling with mud motor',
    casing: '9-5/8" intermediate casing',
  };
  const validHazards = {
    h2s: 'potential presence',
    pressure: 'high pressure zone expected',
    geology: 'unstable formations',
  };
  const validApprovals = [
    { approvedBy: 'engineer-1', role: 'drilling-engineer', date: '2024-01-15' },
    { approvedBy: 'manager-1', role: 'operations-manager', date: '2024-01-16' },
  ];

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.programName).toBe(validProgramName);
      expect(command.options).toBeUndefined();
    });

    it('should create a command with all optional properties', () => {
      const options = {
        afeId: validAfeId,
        status: validStatus,
        version: validVersion,
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.programName).toBe(validProgramName);
      expect(command.options).toEqual(options);
    });

    it('should create a command with partial options', () => {
      const options = {
        afeId: validAfeId,
        status: validStatus,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.afeId).toBe(validAfeId);
      expect(command.options?.status).toBe(validStatus);
      expect(command.options?.version).toBeUndefined();
      expect(command.options?.program).toBeUndefined();
      expect(command.options?.hazards).toBeUndefined();
      expect(command.options?.approvals).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
      );

      // Properties should be accessible
      expect(command.organizationId).toBeDefined();
      expect(command.wellId).toBeDefined();
      expect(command.programName).toBeDefined();
    });

    it('should maintain object references for options', () => {
      const options = {
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options).toBe(options);
      expect(command.options?.program).toBe(validProgram);
      expect(command.options?.hazards).toBe(validHazards);
      expect(command.options?.approvals).toBe(validApprovals);
    });
  });

  describe('options structure', () => {
    it('should handle all option types', () => {
      const options = {
        afeId: validAfeId,
        status: validStatus,
        version: validVersion,
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.afeId).toBe(validAfeId);
      expect(command.options?.status).toBe(validStatus);
      expect(command.options?.version).toBe(validVersion);
      expect(command.options?.program).toEqual(validProgram);
      expect(command.options?.hazards).toEqual(validHazards);
      expect(command.options?.approvals).toEqual(validApprovals);
    });

    it('should handle undefined values in options', () => {
      const options = {
        afeId: undefined,
        status: undefined,
        version: undefined,
        program: undefined,
        hazards: undefined,
        approvals: undefined,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.afeId).toBeUndefined();
      expect(command.options?.status).toBeUndefined();
      expect(command.options?.version).toBeUndefined();
      expect(command.options?.program).toBeUndefined();
      expect(command.options?.hazards).toBeUndefined();
      expect(command.options?.approvals).toBeUndefined();
    });
  });

  describe('DrillingProgramStatus enum', () => {
    it('should have correct drilling program status values', () => {
      expect(DrillingProgramStatus.DRAFT).toBe('draft');
      expect(DrillingProgramStatus.APPROVED).toBe('approved');
      expect(DrillingProgramStatus.IN_PROGRESS).toBe('in_progress');
      expect(DrillingProgramStatus.COMPLETED).toBe('completed');
      expect(DrillingProgramStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const command = new CreateDrillingProgramCommand(
        '', // empty organizationId
        '', // empty wellId
        '', // empty programName
      );

      expect(command.organizationId).toBe('');
      expect(command.wellId).toBe('');
      expect(command.programName).toBe('');
    });

    it('should handle options with empty arrays and objects', () => {
      const options = {
        program: {},
        hazards: {},
        approvals: [],
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.program).toEqual({});
      expect(command.options?.hazards).toEqual({});
      expect(command.options?.approvals).toEqual([]);
    });

    it('should handle version numbers', () => {
      const options = {
        version: 5,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.version).toBe(5);
    });

    it('should handle zero version', () => {
      const options = {
        version: 0,
      };

      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
        options,
      );

      expect(command.options?.version).toBe(0);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateDrillingProgramCommand(
        validOrganizationId,
        validWellId,
        validProgramName,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const wellId1 = command.wellId;
      const wellId2 = command.wellId;
      const programName1 = command.programName;
      const programName2 = command.programName;

      expect(orgId1).toBe(orgId2);
      expect(wellId1).toBe(wellId2);
      expect(programName1).toBe(programName2);
    });
  });
});
