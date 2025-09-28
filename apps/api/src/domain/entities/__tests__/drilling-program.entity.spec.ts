import {
  DrillingProgram,
  DrillingProgramPersistence,
} from '../drilling-program.entity';
import { DrillingProgramStatus } from '../../enums/drilling-program-status.enum';

describe('DrillingProgram Entity', () => {
  const validId = 'drilling-program-123';
  const validOrganizationId = 'org-456';
  const validWellId = 'well-789';
  const validAfeId = 'afe-101';
  const validProgramName = 'Test Drilling Program';
  const validVersion = 1;
  const validStatus = DrillingProgramStatus.DRAFT;
  const validProgram = { objectives: 'Drill to 5000ft' };
  const validHazards = { h2s: 'present' };
  const validApprovals = [{ approvedBy: 'user-1', date: '2024-01-01' }];
  const validEstimatedCost = '100000';
  const validActualCost = '95000';
  const validCreatedAt = new Date('2024-01-01');
  const validUpdatedAt = new Date('2024-01-02');

  describe('Constructor', () => {
    it('should create drilling program with required fields', () => {
      const drillingProgram = new DrillingProgram({
        id: validId,
        organizationId: validOrganizationId,
        wellId: validWellId,
        programName: validProgramName,
      });

      expect(drillingProgram.getId()).toBe(validId);
      expect(drillingProgram.getOrganizationId()).toBe(validOrganizationId);
      expect(drillingProgram.getWellId()).toBe(validWellId);
      expect(drillingProgram.getProgramName()).toBe(validProgramName);
      expect(drillingProgram.getVersion()).toBe(1); // default version
      expect(drillingProgram.getStatus()).toBe(DrillingProgramStatus.DRAFT); // default status
      expect(drillingProgram.getAfeId()).toBeUndefined();
      expect(drillingProgram.getProgram()).toBeUndefined();
      expect(drillingProgram.getHazards()).toBeUndefined();
      expect(drillingProgram.getApprovals()).toBeUndefined();
      expect(drillingProgram.getEstimatedCost()).toBeUndefined();
      expect(drillingProgram.getActualCost()).toBeUndefined();
      expect(drillingProgram.getCreatedAt()).toBeInstanceOf(Date);
      expect(drillingProgram.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create drilling program with all optional fields', () => {
      const drillingProgram = new DrillingProgram({
        id: validId,
        organizationId: validOrganizationId,
        wellId: validWellId,
        programName: validProgramName,
        version: validVersion,
        status: validStatus,
        afeId: validAfeId,
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
        estimatedCost: validEstimatedCost,
        actualCost: validActualCost,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      });

      expect(drillingProgram.getId()).toBe(validId);
      expect(drillingProgram.getOrganizationId()).toBe(validOrganizationId);
      expect(drillingProgram.getWellId()).toBe(validWellId);
      expect(drillingProgram.getAfeId()).toBe(validAfeId);
      expect(drillingProgram.getProgramName()).toBe(validProgramName);
      expect(drillingProgram.getVersion()).toBe(validVersion);
      expect(drillingProgram.getStatus()).toBe(validStatus);
      expect(drillingProgram.getProgram()).toBe(validProgram);
      expect(drillingProgram.getHazards()).toBe(validHazards);
      expect(drillingProgram.getApprovals()).toBe(validApprovals);
      expect(drillingProgram.getEstimatedCost()).toBe(validEstimatedCost);
      expect(drillingProgram.getActualCost()).toBe(validActualCost);
      expect(drillingProgram.getCreatedAt()).toBe(validCreatedAt);
      expect(drillingProgram.getUpdatedAt()).toBe(validUpdatedAt);
    });
  });

  describe('Getters', () => {
    let drillingProgram: DrillingProgram;

    beforeEach(() => {
      drillingProgram = new DrillingProgram({
        id: validId,
        organizationId: validOrganizationId,
        wellId: validWellId,
        programName: validProgramName,
        version: validVersion,
        status: validStatus,
        afeId: validAfeId,
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
        estimatedCost: validEstimatedCost,
        actualCost: validActualCost,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      });
    });

    it('should return correct id', () => {
      expect(drillingProgram.getId()).toBe(validId);
    });

    it('should return correct organization id', () => {
      expect(drillingProgram.getOrganizationId()).toBe(validOrganizationId);
    });

    it('should return correct well id', () => {
      expect(drillingProgram.getWellId()).toBe(validWellId);
    });

    it('should return correct afe id', () => {
      expect(drillingProgram.getAfeId()).toBe(validAfeId);
    });

    it('should return correct program name', () => {
      expect(drillingProgram.getProgramName()).toBe(validProgramName);
    });

    it('should return correct version', () => {
      expect(drillingProgram.getVersion()).toBe(validVersion);
    });

    it('should return correct status', () => {
      expect(drillingProgram.getStatus()).toBe(validStatus);
    });

    it('should return correct program', () => {
      expect(drillingProgram.getProgram()).toBe(validProgram);
    });

    it('should return correct hazards', () => {
      expect(drillingProgram.getHazards()).toBe(validHazards);
    });

    it('should return correct approvals', () => {
      expect(drillingProgram.getApprovals()).toBe(validApprovals);
    });

    it('should return correct estimated cost', () => {
      expect(drillingProgram.getEstimatedCost()).toBe(validEstimatedCost);
    });

    it('should return correct actual cost', () => {
      expect(drillingProgram.getActualCost()).toBe(validActualCost);
    });

    it('should return correct created at', () => {
      expect(drillingProgram.getCreatedAt()).toBe(validCreatedAt);
    });

    it('should return correct updated at', () => {
      expect(drillingProgram.getUpdatedAt()).toBe(validUpdatedAt);
    });
  });

  describe('Persistence Mapping', () => {
    let drillingProgram: DrillingProgram;

    beforeEach(() => {
      drillingProgram = new DrillingProgram({
        id: validId,
        organizationId: validOrganizationId,
        wellId: validWellId,
        programName: validProgramName,
        version: validVersion,
        status: validStatus,
        afeId: validAfeId,
        program: validProgram,
        hazards: validHazards,
        approvals: validApprovals,
        estimatedCost: validEstimatedCost,
        actualCost: validActualCost,
        createdAt: validCreatedAt,
        updatedAt: validUpdatedAt,
      });
    });

    describe('fromPersistence', () => {
      it('should create drilling program from persistence data', () => {
        const persistenceData: DrillingProgramPersistence = {
          id: validId,
          organizationId: validOrganizationId,
          wellId: validWellId,
          afeId: validAfeId,
          programName: validProgramName,
          version: validVersion,
          status: validStatus,
          program: validProgram,
          hazards: validHazards,
          approvals: validApprovals,
          estimatedCost: validEstimatedCost,
          actualCost: validActualCost,
          createdAt: validCreatedAt,
          updatedAt: validUpdatedAt,
        };

        const drillingProgram =
          DrillingProgram.fromPersistence(persistenceData);

        expect(drillingProgram.getId()).toBe(validId);
        expect(drillingProgram.getOrganizationId()).toBe(validOrganizationId);
        expect(drillingProgram.getWellId()).toBe(validWellId);
        expect(drillingProgram.getAfeId()).toBe(validAfeId);
        expect(drillingProgram.getProgramName()).toBe(validProgramName);
        expect(drillingProgram.getVersion()).toBe(validVersion);
        expect(drillingProgram.getStatus()).toBe(validStatus);
        expect(drillingProgram.getProgram()).toBe(validProgram);
        expect(drillingProgram.getHazards()).toBe(validHazards);
        expect(drillingProgram.getApprovals()).toBe(validApprovals);
        expect(drillingProgram.getEstimatedCost()).toBe(validEstimatedCost);
        expect(drillingProgram.getActualCost()).toBe(validActualCost);
        expect(drillingProgram.getCreatedAt()).toBe(validCreatedAt);
        expect(drillingProgram.getUpdatedAt()).toBe(validUpdatedAt);
      });

      it('should handle null values from persistence', () => {
        const persistenceData: DrillingProgramPersistence = {
          id: validId,
          organizationId: validOrganizationId,
          wellId: validWellId,
          afeId: null,
          programName: validProgramName,
          version: validVersion,
          status: validStatus,
          program: null,
          hazards: null,
          approvals: null,
          estimatedCost: null,
          actualCost: null,
          createdAt: validCreatedAt,
          updatedAt: validUpdatedAt,
        };

        const drillingProgram =
          DrillingProgram.fromPersistence(persistenceData);

        expect(drillingProgram.getAfeId()).toBeUndefined();
        expect(drillingProgram.getProgram()).toBeUndefined();
        expect(drillingProgram.getHazards()).toBeUndefined();
        expect(drillingProgram.getApprovals()).toBeUndefined();
        expect(drillingProgram.getEstimatedCost()).toBeUndefined();
        expect(drillingProgram.getActualCost()).toBeUndefined();
      });
    });

    describe('toPersistence', () => {
      it('should convert drilling program to persistence data', () => {
        const persistenceData = drillingProgram.toPersistence();

        expect(persistenceData).toEqual({
          id: validId,
          organizationId: validOrganizationId,
          wellId: validWellId,
          afeId: validAfeId,
          programName: validProgramName,
          version: validVersion,
          status: validStatus,
          program: validProgram,
          hazards: validHazards,
          approvals: validApprovals,
          estimatedCost: validEstimatedCost,
          actualCost: validActualCost,
          createdAt: validCreatedAt,
          updatedAt: validUpdatedAt,
        });
      });

      it('should convert undefined values to null in persistence data', () => {
        const drillingProgramWithoutOptionals = new DrillingProgram({
          id: validId,
          organizationId: validOrganizationId,
          wellId: validWellId,
          programName: validProgramName,
        });

        const persistenceData = drillingProgramWithoutOptionals.toPersistence();

        expect(persistenceData.afeId).toBeNull();
        expect(persistenceData.program).toBeNull();
        expect(persistenceData.hazards).toBeNull();
        expect(persistenceData.approvals).toBeNull();
        expect(persistenceData.estimatedCost).toBeNull();
        expect(persistenceData.actualCost).toBeNull();
      });
    });
  });

  describe('Domain Events', () => {
    let drillingProgram: DrillingProgram;

    beforeEach(() => {
      drillingProgram = new DrillingProgram({
        id: validId,
        organizationId: validOrganizationId,
        wellId: validWellId,
        programName: validProgramName,
      });
    });

    it('should return empty domain events array initially', () => {
      const events = drillingProgram.getDomainEvents();
      expect(events).toEqual([]);
    });

    it('should return copy of domain events', () => {
      const events1 = drillingProgram.getDomainEvents();
      const events2 = drillingProgram.getDomainEvents();

      expect(events1).not.toBe(events2); // Different references
      expect(events1).toEqual(events2); // Same content
    });

    it('should clear domain events', () => {
      // Note: This entity doesn't have methods to add events, so we test the clear functionality
      drillingProgram.clearDomainEvents();
      const events = drillingProgram.getDomainEvents();
      expect(events).toEqual([]);
    });
  });

  describe('DrillingProgramStatus Enum', () => {
    it('should have correct status values', () => {
      expect(DrillingProgramStatus.DRAFT).toBe('draft');
      expect(DrillingProgramStatus.APPROVED).toBe('approved');
      expect(DrillingProgramStatus.IN_PROGRESS).toBe('in_progress');
      expect(DrillingProgramStatus.COMPLETED).toBe('completed');
      expect(DrillingProgramStatus.CANCELLED).toBe('cancelled');
    });
  });
});
