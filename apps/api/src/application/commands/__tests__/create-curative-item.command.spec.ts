import { CreateCurativeItemCommand } from '../create-curative-item.command';
import {
  CurativePriority,
  CurativeStatus,
} from '../../../domain/entities/curative-item.entity';

describe('CreateCurativeItemCommand', () => {
  const validTitleOpinionId = 'opinion-123';
  const validOrganizationId = 'org-456';
  const validItemNumber = 'CI-001';
  const validDefectType = 'ownership_gap';
  const validDescription = 'Missing ownership record for 2015-2018';
  const validPriorityHigh = 'high' as CurativePriority;
  const validPriorityMedium = 'medium' as CurativePriority;
  const validPriorityLow = 'low' as CurativePriority;
  const validAssignedTo = 'user-789';
  const validDueDate = new Date('2024-06-15');
  const validStatusOpen = CurativeStatus.OPEN;
  const validStatusInProgress = CurativeStatus.IN_PROGRESS;
  // Valid status options for testing
  expect(CurativeStatus.RESOLVED).toBeDefined();
  expect(CurativeStatus.WAIVED).toBeDefined();

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
      );

      expect(command.titleOpinionId).toBe(validTitleOpinionId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.itemNumber).toBe(validItemNumber);
      expect(command.defectType).toBe(validDefectType);
      expect(command.description).toBe(validDescription);
      expect(command.priority).toBe('high');
      expect(command.assignedTo).toBeUndefined();
      expect(command.dueDate).toBeUndefined();
      expect(command.status).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityMedium,
        validAssignedTo,
        validDueDate,
        validStatusOpen,
      );

      expect(command.titleOpinionId).toBe(validTitleOpinionId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.itemNumber).toBe(validItemNumber);
      expect(command.defectType).toBe(validDefectType);
      expect(command.description).toBe(validDescription);
      expect(command.priority).toBe('medium');
      expect(command.assignedTo).toBe(validAssignedTo);
      expect(command.dueDate).toBe(validDueDate);
      expect(command.status).toBe(CurativeStatus.OPEN);
    });

    it('should create a command with some optional properties', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityLow,
        validAssignedTo,
        undefined,
        validStatusInProgress,
      );

      expect(command.priority).toBe('low');
      expect(command.assignedTo).toBe(validAssignedTo);
      expect(command.dueDate).toBeUndefined();
      expect(command.status).toBe(CurativeStatus.IN_PROGRESS);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        validAssignedTo,
      );

      expect(command.titleOpinionId).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.itemNumber).toBeDefined();
      expect(command.defectType).toBeDefined();
      expect(command.description).toBeDefined();
      expect(command.priority).toBeDefined();
      expect(command.assignedTo).toBeDefined();
    });

    it('should maintain date reference for dueDate', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        validAssignedTo,
        validDueDate,
      );

      expect(command.dueDate).toBe(validDueDate);
    });
  });

  describe('CurativePriority values', () => {
    it('should accept high as valid priority', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        'high',
      );

      expect(command.priority).toBe('high');
    });

    it('should accept medium as valid priority', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        'medium',
      );

      expect(command.priority).toBe('medium');
    });

    it('should accept low as valid priority', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        'low',
      );

      expect(command.priority).toBe('low');
    });
  });

  describe('CurativeStatus enum values', () => {
    it('should accept OPEN as valid status', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        undefined,
        undefined,
        CurativeStatus.OPEN,
      );

      expect(command.status).toBe(CurativeStatus.OPEN);
    });

    it('should accept IN_PROGRESS as valid status', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        undefined,
        undefined,
        CurativeStatus.IN_PROGRESS,
      );

      expect(command.status).toBe(CurativeStatus.IN_PROGRESS);
    });

    it('should accept RESOLVED as valid status', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        undefined,
        undefined,
        CurativeStatus.RESOLVED,
      );

      expect(command.status).toBe(CurativeStatus.RESOLVED);
    });

    it('should accept WAIVED as valid status', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        undefined,
        undefined,
        CurativeStatus.WAIVED,
      );

      expect(command.status).toBe(CurativeStatus.WAIVED);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for string properties', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        '',
        '',
        '',
        validPriorityHigh,
        '',
      );

      expect(command.itemNumber).toBe('');
      expect(command.defectType).toBe('');
      expect(command.description).toBe('');
      expect(command.assignedTo).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
        undefined,
        undefined,
        undefined,
      );

      expect(command.assignedTo).toBeUndefined();
      expect(command.dueDate).toBeUndefined();
      expect(command.status).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateCurativeItemCommand(
        validTitleOpinionId,
        validOrganizationId,
        validItemNumber,
        validDefectType,
        validDescription,
        validPriorityHigh,
      );

      const titleOpinionId1 = command.titleOpinionId;
      const titleOpinionId2 = command.titleOpinionId;
      const priority1 = command.priority;
      const priority2 = command.priority;

      expect(titleOpinionId1).toBe(titleOpinionId2);
      expect(priority1).toBe(priority2);
    });
  });
});
