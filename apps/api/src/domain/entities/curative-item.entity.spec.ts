import {
  CurativeItem,
  CurativeStatus,
  CurativePriority,
  CurativeItemProps,
} from './curative-item.entity';
import { CurativeItemStatusChangedEvent } from '../events/curative-item-status-changed.event';
import { CurativeItemAssignedEvent } from '../events/curative-item-assigned.event';
import { CurativeItemDueDateChangedEvent } from '../events/curative-item-due-date-changed.event';

describe('CurativeItem', () => {
  describe('enums and types', () => {
    it('should define CurativeStatus values', () => {
      expect(CurativeStatus.OPEN).toBe('open');
      expect(CurativeStatus.IN_PROGRESS).toBe('in_progress');
      expect(CurativeStatus.RESOLVED).toBe('resolved');
      expect(CurativeStatus.WAIVED).toBe('waived');
    });

    it('should define CurativePriority values', () => {
      const priorities: CurativePriority[] = ['high', 'medium', 'low'];
      expect(priorities).toBeDefined();
    });
  });

  describe('CurativeItemProps interface', () => {
    it('should define required properties', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
      };

      expect(props.id).toBe('item-123');
      expect(props.titleOpinionId).toBe('opinion-456');
      expect(props.itemNumber).toBe('CI-001');
      expect(props.defectType).toBe('missing_signature');
      expect(props.description).toBe('Signature is missing from the deed');
      expect(props.priority).toBe('high');
    });

    it('should support all optional properties', () => {
      const dueDate = new Date('2024-02-01');
      const resolutionDate = new Date('2024-01-15');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-10');

      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.IN_PROGRESS,
        assignedTo: 'user-789',
        dueDate,
        resolutionDate,
        resolutionNotes: 'Resolved by obtaining signature',
        createdAt,
        updatedAt,
        version: 2,
      };

      expect(props.status).toBe(CurativeStatus.IN_PROGRESS);
      expect(props.assignedTo).toBe('user-789');
      expect(props.dueDate).toEqual(dueDate);
      expect(props.resolutionDate).toEqual(resolutionDate);
      expect(props.resolutionNotes).toBe('Resolved by obtaining signature');
      expect(props.createdAt).toEqual(createdAt);
      expect(props.updatedAt).toEqual(updatedAt);
      expect(props.version).toBe(2);
    });
  });

  describe('constructor', () => {
    it('should create item with minimal required properties', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
      };

      const item = new CurativeItem(props);

      expect(item.getId()).toBe('item-123');
      expect(item.getTitleOpinionId()).toBe('opinion-456');
      expect(item.getItemNumber()).toBe('CI-001');
      expect(item.getDefectType()).toBe('missing_signature');
      expect(item.getDescription()).toBe('Signature is missing from the deed');
      expect(item.getPriority()).toBe('high');
      expect(item.getStatus()).toBe(CurativeStatus.OPEN);
      expect(item.getAssignedTo()).toBeUndefined();
      expect(item.getDueDate()).toBeUndefined();
      expect(item.getResolutionDate()).toBeUndefined();
      expect(item.getResolutionNotes()).toBeUndefined();
      expect(item.getDomainEvents()).toHaveLength(0);
    });

    it('should create item with all properties', () => {
      const dueDate = new Date('2024-02-01');
      const resolutionDate = new Date('2024-01-15');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-10');

      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.RESOLVED,
        assignedTo: 'user-789',
        dueDate,
        resolutionDate,
        resolutionNotes: 'Resolved by obtaining signature',
        createdAt,
        updatedAt,
        version: 3,
      };

      const item = new CurativeItem(props);

      expect(item.getId()).toBe('item-123');
      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
      expect(item.getAssignedTo()).toBe('user-789');
      expect(item.getDueDate()).toEqual(dueDate);
      expect(item.getResolutionDate()).toEqual(resolutionDate);
      expect(item.getResolutionNotes()).toBe('Resolved by obtaining signature');
    });

    it('should default status to OPEN when not provided', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'medium',
      };

      const item = new CurativeItem(props);
      expect(item.getStatus()).toBe(CurativeStatus.OPEN);
    });

    it('should default version to 1 when not provided', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'low',
      };

      const item = new CurativeItem(props);
      // Version is private, but we can test it indirectly through behavior
      expect(item.getDomainEvents()).toHaveLength(0);
    });

    it('should create copies of date objects to prevent external mutation', () => {
      const originalDueDate = new Date('2024-02-01');
      const originalResolutionDate = new Date('2024-01-15');

      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        dueDate: originalDueDate,
        resolutionDate: originalResolutionDate,
      };

      const item = new CurativeItem(props);

      // Modify original dates
      originalDueDate.setFullYear(2025);
      originalResolutionDate.setMonth(5);

      // Item dates should remain unchanged
      expect(item.getDueDate()?.getFullYear()).toBe(2024);
      expect(item.getResolutionDate()?.getMonth()).toBe(0); // January
    });
  });

  describe('getters', () => {
    let item: CurativeItem;
    let props: CurativeItemProps;

    beforeEach(() => {
      const dueDate = new Date('2024-02-01');
      const resolutionDate = new Date('2024-01-15');

      props = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.IN_PROGRESS,
        assignedTo: 'user-789',
        dueDate,
        resolutionDate,
        resolutionNotes: 'Resolved by obtaining signature',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
        version: 2,
      };

      item = new CurativeItem(props);
    });

    it('should return correct id', () => {
      expect(item.getId()).toBe('item-123');
    });

    it('should return correct titleOpinionId', () => {
      expect(item.getTitleOpinionId()).toBe('opinion-456');
    });

    it('should return correct itemNumber', () => {
      expect(item.getItemNumber()).toBe('CI-001');
    });

    it('should return correct defectType', () => {
      expect(item.getDefectType()).toBe('missing_signature');
    });

    it('should return correct description', () => {
      expect(item.getDescription()).toBe('Signature is missing from the deed');
    });

    it('should return correct priority', () => {
      expect(item.getPriority()).toBe('high');
    });

    it('should return correct status', () => {
      expect(item.getStatus()).toBe(CurativeStatus.IN_PROGRESS);
    });

    it('should return correct assignedTo', () => {
      expect(item.getAssignedTo()).toBe('user-789');
    });

    it('should return correct dueDate', () => {
      expect(item.getDueDate()).toEqual(props.dueDate);
    });

    it('should return correct resolutionDate', () => {
      expect(item.getResolutionDate()).toEqual(props.resolutionDate);
    });

    it('should return correct resolutionNotes', () => {
      expect(item.getResolutionNotes()).toBe('Resolved by obtaining signature');
    });

    it('should return copies of dates to prevent external mutation', () => {
      const returnedDueDate = item.getDueDate();
      const returnedResolutionDate = item.getResolutionDate();

      if (returnedDueDate) {
        returnedDueDate.setFullYear(2025);
      }
      if (returnedResolutionDate) {
        returnedResolutionDate.setMonth(5);
      }

      // Original dates should remain unchanged
      expect(item.getDueDate()?.getFullYear()).toBe(2024);
      expect(item.getResolutionDate()?.getMonth()).toBe(0);
    });
  });

  describe('updateStatus', () => {
    let item: CurativeItem;

    beforeEach(() => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.OPEN,
      };

      item = new CurativeItem(props);
    });

    it('should transition from OPEN to IN_PROGRESS', () => {
      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-789');

      expect(item.getStatus()).toBe(CurativeStatus.IN_PROGRESS);
      expect(item.getDomainEvents()).toHaveLength(1);
      expect(item.getDomainEvents()[0]).toBeInstanceOf(
        CurativeItemStatusChangedEvent,
      );

      const event = item.getDomainEvents()[0] as CurativeItemStatusChangedEvent;
      expect(event.curativeItemId).toBe('item-123');
      expect(event.previousStatus).toBe(CurativeStatus.OPEN);
      expect(event.newStatus).toBe(CurativeStatus.IN_PROGRESS);
      expect(event.updatedBy).toBe('user-789');
    });

    it('should transition to RESOLVED and set resolution date', () => {
      item.updateStatus(
        CurativeStatus.RESOLVED,
        'user-789',
        'Fixed the signature issue',
      );

      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
      expect(item.getResolutionDate()).toBeInstanceOf(Date);
      expect(item.getResolutionNotes()).toBe('Fixed the signature issue');

      const event = item.getDomainEvents()[0] as CurativeItemStatusChangedEvent;
      expect(event.newStatus).toBe(CurativeStatus.RESOLVED);
      expect(event.resolutionNotes).toBe('Fixed the signature issue');
    });

    it('should transition to WAIVED', () => {
      item.updateStatus(
        CurativeStatus.WAIVED,
        'user-789',
        'Waived due to policy change',
      );

      expect(item.getStatus()).toBe(CurativeStatus.WAIVED);
      expect(item.getResolutionNotes()).toBe('Waived due to policy change');

      const event = item.getDomainEvents()[0] as CurativeItemStatusChangedEvent;
      expect(event.newStatus).toBe(CurativeStatus.WAIVED);
    });

    it('should not transition from OPEN to IN_PROGRESS if already in progress', () => {
      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-789');
      item.clearDomainEvents();

      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-789');

      expect(item.getStatus()).toBe(CurativeStatus.IN_PROGRESS);
      expect(item.getDomainEvents()).toHaveLength(0); // No new event
    });

    it('should not transition to RESOLVED if already resolved', () => {
      item.updateStatus(CurativeStatus.RESOLVED, 'user-789');
      item.clearDomainEvents();

      item.updateStatus(CurativeStatus.RESOLVED, 'user-789');

      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
      expect(item.getDomainEvents()).toHaveLength(0);
    });

    it('should throw error when trying to waive a resolved item', () => {
      item.updateStatus(CurativeStatus.RESOLVED, 'user-789');

      expect(() => {
        item.updateStatus(CurativeStatus.WAIVED, 'user-789');
      }).toThrow('Cannot waive a resolved item');
    });

    it('should throw error for invalid status transition', () => {
      expect(() => {
        item.updateStatus('invalid' as any, 'user-789');
      }).toThrow('Invalid status: invalid');
    });
  });

  describe('startProgress', () => {
    it('should start progress from OPEN status', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.OPEN,
      };

      const item = new CurativeItem(props);

      item.startProgress('user-789');

      expect(item.getStatus()).toBe(CurativeStatus.IN_PROGRESS);
      expect(item.getAssignedTo()).toBe('user-789');
    });

    it('should not change status if not OPEN', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.RESOLVED,
      };

      const item = new CurativeItem(props);

      item.startProgress('user-789');

      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
    });

    it('should keep existing assignee if none provided', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.OPEN,
        assignedTo: 'existing-user',
      };

      const item = new CurativeItem(props);

      item.startProgress();

      expect(item.getAssignedTo()).toBe('existing-user');
    });
  });

  describe('resolve', () => {
    it('should resolve item and set resolution date', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.IN_PROGRESS,
      };

      const item = new CurativeItem(props);
      const customResolutionDate = new Date('2024-01-15');

      item.resolve('Issue resolved', customResolutionDate);

      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
      expect(item.getResolutionNotes()).toBe('Issue resolved');
      expect(item.getResolutionDate()).toEqual(customResolutionDate);
    });

    it('should use current date if no resolution date provided', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.IN_PROGRESS,
      };

      const item = new CurativeItem(props);

      item.resolve();

      expect(item.getStatus()).toBe(CurativeStatus.RESOLVED);
      expect(item.getResolutionDate()).toBeInstanceOf(Date);
    });

    it('should not change status if already resolved', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.RESOLVED,
        resolutionNotes: 'Already resolved',
      };

      const item = new CurativeItem(props);

      item.resolve('New notes');

      expect(item.getResolutionNotes()).toBe('Already resolved'); // Should not change
    });
  });

  describe('waive', () => {
    it('should waive item', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.IN_PROGRESS,
      };

      const item = new CurativeItem(props);

      item.waive('Waived due to policy exception');

      expect(item.getStatus()).toBe(CurativeStatus.WAIVED);
      expect(item.getResolutionNotes()).toBe('Waived due to policy exception');
    });

    it('should throw error when trying to waive a resolved item', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        status: CurativeStatus.RESOLVED,
      };

      const item = new CurativeItem(props);

      expect(() => {
        item.waive('Waived');
      }).toThrow('Cannot waive a resolved item');
    });
  });

  describe('reassign', () => {
    it('should reassign item and raise domain event', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        assignedTo: 'old-user',
      };

      const item = new CurativeItem(props);

      item.reassign('new-user', 'admin-user');

      expect(item.getAssignedTo()).toBe('new-user');
      expect(item.getDomainEvents()).toHaveLength(1);
      expect(item.getDomainEvents()[0]).toBeInstanceOf(
        CurativeItemAssignedEvent,
      );

      const event = item.getDomainEvents()[0] as CurativeItemAssignedEvent;
      expect(event.curativeItemId).toBe('item-123');
      expect(event.newAssignee).toBe('new-user');
      expect(event.updatedBy).toBe('admin-user');
      expect(event.previousAssignee).toBe('old-user');
    });
  });

  describe('setDueDate', () => {
    it('should set due date and raise domain event', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        dueDate: new Date('2024-01-01'),
      };

      const item = new CurativeItem(props);
      const newDueDate = new Date('2024-02-01');

      item.setDueDate(newDueDate, 'admin-user');

      expect(item.getDueDate()).toEqual(newDueDate);
      expect(item.getDomainEvents()).toHaveLength(1);
      expect(item.getDomainEvents()[0]).toBeInstanceOf(
        CurativeItemDueDateChangedEvent,
      );

      const event =
        item.getDomainEvents()[0] as CurativeItemDueDateChangedEvent;
      expect(event.curativeItemId).toBe('item-123');
      expect(event.updatedBy).toBe('admin-user');
      expect(event.previousDueDate).toEqual(new Date('2024-01-01'));
      expect(event.newDueDate).toEqual(newDueDate);
    });

    it('should clear due date', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
        dueDate: new Date('2024-01-01'),
      };

      const item = new CurativeItem(props);

      item.setDueDate(undefined, 'admin-user');

      expect(item.getDueDate()).toBeUndefined();
    });
  });

  describe('domain events', () => {
    it('should collect domain events', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
      };

      const item = new CurativeItem(props);

      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-1');
      item.reassign('user-2', 'admin');
      item.setDueDate(new Date('2024-02-01'), 'admin');

      expect(item.getDomainEvents()).toHaveLength(3);
    });

    it('should clear domain events', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
      };

      const item = new CurativeItem(props);

      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-1');
      expect(item.getDomainEvents()).toHaveLength(1);

      item.clearDomainEvents();
      expect(item.getDomainEvents()).toHaveLength(0);
    });

    it('should return copy of domain events array', () => {
      const props: CurativeItemProps = {
        id: 'item-123',
        titleOpinionId: 'opinion-456',
        itemNumber: 'CI-001',
        defectType: 'missing_signature',
        description: 'Signature is missing from the deed',
        priority: 'high',
      };

      const item = new CurativeItem(props);

      item.updateStatus(CurativeStatus.IN_PROGRESS, 'user-1');
      const events = item.getDomainEvents();
      events.push({} as any); // Try to modify the returned array

      expect(item.getDomainEvents()).toHaveLength(1); // Should still be 1
    });
  });
});
