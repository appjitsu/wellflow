import { Workover, WorkoverPersistence } from '../workover.entity';
import { WorkoverStatus } from '../../enums/workover-status.enum';

describe('Workover Entity', () => {
  const validProps = {
    id: 'workover-123',
    organizationId: 'org-456',
    wellId: 'well-789',
    afeId: 'afe-101',
    reason: 'Well optimization',
    status: WorkoverStatus.PLANNED,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-15'),
    estimatedCost: '50000.00',
    actualCost: '45000.00',
    preProductionSnapshot: { rate: 100, pressure: 2000 },
    postProductionSnapshot: { rate: 120, pressure: 2100 },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  describe('Constructor', () => {
    it('should create workover with required fields', () => {
      const minimalProps = {
        id: 'workover-123',
        organizationId: 'org-456',
        wellId: 'well-789',
      };

      const workover = new Workover(minimalProps);

      expect(workover.getId()).toBe('workover-123');
      expect(workover.getOrganizationId()).toBe('org-456');
      expect(workover.getWellId()).toBe('well-789');
      expect(workover.getStatus()).toBe(WorkoverStatus.PLANNED); // default status
    });

    it('should create workover with all optional fields', () => {
      const workover = new Workover(validProps);

      expect(workover.getAfeId()).toBe('afe-101');
      expect(workover.getReason()).toBe('Well optimization');
      expect(workover.getStatus()).toBe(WorkoverStatus.PLANNED);
      expect(workover.getStartDate()).toEqual(new Date('2024-02-01'));
      expect(workover.getEndDate()).toEqual(new Date('2024-02-15'));
      expect(workover.getEstimatedCost()).toBe('50000.00');
      expect(workover.getActualCost()).toBe('45000.00');
      expect(workover.getPreProductionSnapshot()).toEqual({
        rate: 100,
        pressure: 2000,
      });
      expect(workover.getPostProductionSnapshot()).toEqual({
        rate: 120,
        pressure: 2100,
      });
    });

    it('should set default status to PLANNED when not provided', () => {
      const propsWithoutStatus = {
        id: 'workover-123',
        organizationId: 'org-456',
        wellId: 'well-789',
      };

      const workover = new Workover(propsWithoutStatus);

      expect(workover.getStatus()).toBe(WorkoverStatus.PLANNED);
    });

    it('should set default timestamps when not provided', () => {
      const propsWithoutTimestamps = {
        id: 'workover-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        status: WorkoverStatus.IN_PROGRESS,
      };

      const workover = new Workover(propsWithoutTimestamps);

      expect(workover.getCreatedAt()).toBeInstanceOf(Date);
      expect(workover.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('Getters', () => {
    let workover: Workover;

    beforeEach(() => {
      workover = new Workover(validProps);
    });

    it('should return correct id', () => {
      expect(workover.getId()).toBe('workover-123');
    });

    it('should return correct organizationId', () => {
      expect(workover.getOrganizationId()).toBe('org-456');
    });

    it('should return correct wellId', () => {
      expect(workover.getWellId()).toBe('well-789');
    });

    it('should return correct afeId', () => {
      expect(workover.getAfeId()).toBe('afe-101');
    });

    it('should return correct reason', () => {
      expect(workover.getReason()).toBe('Well optimization');
    });

    it('should return correct status', () => {
      expect(workover.getStatus()).toBe(WorkoverStatus.PLANNED);
    });

    it('should return correct startDate', () => {
      expect(workover.getStartDate()).toEqual(new Date('2024-02-01'));
    });

    it('should return correct endDate', () => {
      expect(workover.getEndDate()).toEqual(new Date('2024-02-15'));
    });

    it('should return correct estimatedCost', () => {
      expect(workover.getEstimatedCost()).toBe('50000.00');
    });

    it('should return correct actualCost', () => {
      expect(workover.getActualCost()).toBe('45000.00');
    });

    it('should return correct preProductionSnapshot', () => {
      expect(workover.getPreProductionSnapshot()).toEqual({
        rate: 100,
        pressure: 2000,
      });
    });

    it('should return correct postProductionSnapshot', () => {
      expect(workover.getPostProductionSnapshot()).toEqual({
        rate: 120,
        pressure: 2100,
      });
    });

    it('should return correct createdAt', () => {
      expect(workover.getCreatedAt()).toEqual(new Date('2024-01-15'));
    });

    it('should return correct updatedAt', () => {
      expect(workover.getUpdatedAt()).toEqual(new Date('2024-01-15'));
    });

    it('should return undefined for optional fields when not set', () => {
      const minimalWorkover = new Workover({
        id: 'workover-123',
        organizationId: 'org-456',
        wellId: 'well-789',
      });

      expect(minimalWorkover.getAfeId()).toBeUndefined();
      expect(minimalWorkover.getReason()).toBeUndefined();
      expect(minimalWorkover.getStartDate()).toBeUndefined();
      expect(minimalWorkover.getEndDate()).toBeUndefined();
      expect(minimalWorkover.getEstimatedCost()).toBeUndefined();
      expect(minimalWorkover.getActualCost()).toBeUndefined();
      expect(minimalWorkover.getPreProductionSnapshot()).toBeUndefined();
      expect(minimalWorkover.getPostProductionSnapshot()).toBeUndefined();
    });
  });

  describe('Factory Methods', () => {
    describe('fromPersistence', () => {
      it('should create workover from persistence data', () => {
        const persistenceData: WorkoverPersistence = {
          id: 'workover-123',
          organizationId: 'org-456',
          wellId: 'well-789',
          afeId: 'afe-101',
          reason: 'Well optimization',
          status: WorkoverStatus.COMPLETED,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-15'),
          estimatedCost: '50000.00',
          actualCost: '45000.00',
          preProductionSnapshot: { rate: 100, pressure: 2000 },
          postProductionSnapshot: { rate: 120, pressure: 2100 },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-15'),
        };

        const workover = Workover.fromPersistence(persistenceData);

        expect(workover.getId()).toBe('workover-123');
        expect(workover.getOrganizationId()).toBe('org-456');
        expect(workover.getWellId()).toBe('well-789');
        expect(workover.getAfeId()).toBe('afe-101');
        expect(workover.getReason()).toBe('Well optimization');
        expect(workover.getStatus()).toBe(WorkoverStatus.COMPLETED);
        expect(workover.getStartDate()).toEqual(new Date('2024-02-01'));
        expect(workover.getEndDate()).toEqual(new Date('2024-02-15'));
        expect(workover.getEstimatedCost()).toBe('50000.00');
        expect(workover.getActualCost()).toBe('45000.00');
        expect(workover.getPreProductionSnapshot()).toEqual({
          rate: 100,
          pressure: 2000,
        });
        expect(workover.getPostProductionSnapshot()).toEqual({
          rate: 120,
          pressure: 2100,
        });
        expect(workover.getCreatedAt()).toEqual(new Date('2024-01-15'));
        expect(workover.getUpdatedAt()).toEqual(new Date('2024-02-15'));
      });

      it('should handle null values from persistence', () => {
        const persistenceDataWithNulls: WorkoverPersistence = {
          id: 'workover-123',
          organizationId: 'org-456',
          wellId: 'well-789',
          afeId: null,
          reason: null,
          status: WorkoverStatus.PLANNED,
          startDate: null,
          endDate: null,
          estimatedCost: null,
          actualCost: null,
          preProductionSnapshot: null,
          postProductionSnapshot: null,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        };

        const workover = Workover.fromPersistence(persistenceDataWithNulls);

        expect(workover.getAfeId()).toBeUndefined();
        expect(workover.getReason()).toBeUndefined();
        expect(workover.getStartDate()).toBeUndefined();
        expect(workover.getEndDate()).toBeUndefined();
        expect(workover.getEstimatedCost()).toBeUndefined();
        expect(workover.getActualCost()).toBeUndefined();
        expect(workover.getPreProductionSnapshot()).toBeUndefined();
        expect(workover.getPostProductionSnapshot()).toBeUndefined();
      });
    });
  });

  describe('Persistence Methods', () => {
    let workover: Workover;

    beforeEach(() => {
      workover = new Workover(validProps);
    });

    describe('toPersistence', () => {
      it('should convert to persistence format correctly', () => {
        const persistenceData = workover.toPersistence();

        expect(persistenceData.id).toBe('workover-123');
        expect(persistenceData.organizationId).toBe('org-456');
        expect(persistenceData.wellId).toBe('well-789');
        expect(persistenceData.afeId).toBe('afe-101');
        expect(persistenceData.reason).toBe('Well optimization');
        expect(persistenceData.status).toBe(WorkoverStatus.PLANNED);
        expect(persistenceData.startDate).toEqual(new Date('2024-02-01'));
        expect(persistenceData.endDate).toEqual(new Date('2024-02-15'));
        expect(persistenceData.estimatedCost).toBe('50000.00');
        expect(persistenceData.actualCost).toBe('45000.00');
        expect(persistenceData.preProductionSnapshot).toEqual({
          rate: 100,
          pressure: 2000,
        });
        expect(persistenceData.postProductionSnapshot).toEqual({
          rate: 120,
          pressure: 2100,
        });
        expect(persistenceData.createdAt).toEqual(new Date('2024-01-15'));
        expect(persistenceData.updatedAt).toEqual(new Date('2024-01-15'));
      });

      it('should handle undefined values in persistence', () => {
        const minimalWorkover = new Workover({
          id: 'workover-123',
          organizationId: 'org-456',
          wellId: 'well-789',
        });

        const persistenceData = minimalWorkover.toPersistence();

        expect(persistenceData.afeId).toBeNull();
        expect(persistenceData.reason).toBeNull();
        expect(persistenceData.startDate).toBeNull();
        expect(persistenceData.endDate).toBeNull();
        expect(persistenceData.estimatedCost).toBeNull();
        expect(persistenceData.actualCost).toBeNull();
        expect(persistenceData.preProductionSnapshot).toBeNull();
        expect(persistenceData.postProductionSnapshot).toBeNull();
      });
    });
  });

  describe('Domain Events', () => {
    it('should manage domain events', () => {
      const workover = new Workover(validProps);

      expect(workover.getDomainEvents()).toHaveLength(0);

      // Domain events array should be returned as a copy
      const events1 = workover.getDomainEvents();
      const events2 = workover.getDomainEvents();
      expect(events1).not.toBe(events2); // Different references
      expect(events1).toEqual(events2); // Same content
    });

    it('should clear domain events', () => {
      const workover = new Workover(validProps);

      workover.clearDomainEvents();
      expect(workover.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('WorkoverStatus Enum', () => {
    it('should define all required status values', () => {
      expect(WorkoverStatus.PLANNED).toBe('planned');
      expect(WorkoverStatus.IN_PROGRESS).toBe('in_progress');
      expect(WorkoverStatus.COMPLETED).toBe('completed');
      expect(WorkoverStatus.CANCELLED).toBe('cancelled');
    });
  });
});
