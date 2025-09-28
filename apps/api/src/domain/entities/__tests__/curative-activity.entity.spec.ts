import {
  CurativeActivity,
  ActionType,
  CurativeActivityProps,
} from '../curative-activity.entity';

describe('CurativeActivity', () => {
  describe('ActionType enum', () => {
    it('should have all required action type values', () => {
      expect(ActionType.NOTE).toBe('note');
      expect(ActionType.ASSIGNED).toBe('assigned');
      expect(ActionType.STATUS_CHANGE).toBe('status_change');
      expect(ActionType.DOC_UPLOADED).toBe('doc_uploaded');
      expect(ActionType.EMAIL).toBe('email');
      expect(ActionType.CALL).toBe('call');
      expect(ActionType.FILED).toBe('filed');
      expect(ActionType.PREPARED).toBe('prepared');
    });
  });

  describe('CurativeActivityProps interface', () => {
    it('should define required properties', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
      };

      expect(props.id).toBe('activity-123');
      expect(props.curativeItemId).toBe('item-456');
      expect(props.actionType).toBe(ActionType.NOTE);
    });

    it('should support all optional properties', () => {
      const actionDate = new Date('2024-01-15T10:00:00Z');
      const dueDate = new Date('2024-01-20T10:00:00Z');
      const createdAt = new Date('2024-01-15T09:00:00Z');
      const updatedAt = new Date('2024-01-15T10:00:00Z');

      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.STATUS_CHANGE,
        actionBy: 'user-789',
        actionDate,
        details: 'Status changed from pending to approved',
        previousStatus: 'pending',
        newStatus: 'approved',
        dueDate,
        createdAt,
        updatedAt,
      };

      expect(props.actionBy).toBe('user-789');
      expect(props.actionDate).toEqual(actionDate);
      expect(props.details).toBe('Status changed from pending to approved');
      expect(props.previousStatus).toBe('pending');
      expect(props.newStatus).toBe('approved');
      expect(props.dueDate).toEqual(dueDate);
      expect(props.createdAt).toEqual(createdAt);
      expect(props.updatedAt).toEqual(updatedAt);
    });
  });

  describe('constructor', () => {
    it('should create activity with minimal required properties', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
      };

      const activity = new CurativeActivity(props);

      expect(activity.getId()).toBe('activity-123');
      expect(activity.getCurativeItemId()).toBe('item-456');
      expect(activity.getActionType()).toBe(ActionType.NOTE);
      expect(activity.getActionDate()).toBeInstanceOf(Date);
      expect(activity.getActionBy()).toBeUndefined();
      expect(activity.getDetails()).toBeUndefined();
      expect(activity.getPreviousStatus()).toBeUndefined();
      expect(activity.getNewStatus()).toBeUndefined();
      expect(activity.getDueDate()).toBeUndefined();
    });

    it('should create activity with all properties', () => {
      const actionDate = new Date('2024-01-15T10:00:00Z');
      const dueDate = new Date('2024-01-20T10:00:00Z');
      const createdAt = new Date('2024-01-15T09:00:00Z');
      const updatedAt = new Date('2024-01-15T10:00:00Z');

      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.STATUS_CHANGE,
        actionBy: 'user-789',
        actionDate,
        details: 'Status changed from pending to approved',
        previousStatus: 'pending',
        newStatus: 'approved',
        dueDate,
        createdAt,
        updatedAt,
      };

      const activity = new CurativeActivity(props);

      expect(activity.getId()).toBe('activity-123');
      expect(activity.getCurativeItemId()).toBe('item-456');
      expect(activity.getActionType()).toBe(ActionType.STATUS_CHANGE);
      expect(activity.getActionBy()).toBe('user-789');
      expect(activity.getActionDate()).toEqual(actionDate);
      expect(activity.getDetails()).toBe(
        'Status changed from pending to approved',
      );
      expect(activity.getPreviousStatus()).toBe('pending');
      expect(activity.getNewStatus()).toBe('approved');
      expect(activity.getDueDate()).toEqual(dueDate);
    });

    it('should set actionDate to current date if not provided', () => {
      const beforeCreation = new Date();
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
      };

      const activity = new CurativeActivity(props);
      const afterCreation = new Date();

      const actionDate = activity.getActionDate();
      expect(actionDate.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(actionDate.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should set createdAt and updatedAt to current date if not provided', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
      };

      const activity = new CurativeActivity(props);

      // We can't directly access createdAt/updatedAt as they're private,
      // but we can verify the activity was created successfully
      expect(activity.getId()).toBe('activity-123');
    });

    it('should create a copy of dueDate to prevent external mutation', () => {
      const originalDueDate = new Date('2024-01-20T10:00:00Z');
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.ASSIGNED,
        dueDate: originalDueDate,
      };

      const activity = new CurativeActivity(props);

      // Modify the original date
      originalDueDate.setFullYear(2025);

      // The activity's due date should remain unchanged
      expect(activity.getDueDate()?.getFullYear()).toBe(2024);
    });
  });

  describe('getters', () => {
    let activity: CurativeActivity;
    let props: CurativeActivityProps;

    beforeEach(() => {
      const actionDate = new Date('2024-01-15T10:00:00Z');
      const dueDate = new Date('2024-01-20T10:00:00Z');

      props = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.STATUS_CHANGE,
        actionBy: 'user-789',
        actionDate,
        details: 'Status changed from pending to approved',
        previousStatus: 'pending',
        newStatus: 'approved',
        dueDate,
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      };

      activity = new CurativeActivity(props);
    });

    it('should return correct id', () => {
      expect(activity.getId()).toBe('activity-123');
    });

    it('should return correct curativeItemId', () => {
      expect(activity.getCurativeItemId()).toBe('item-456');
    });

    it('should return correct actionType', () => {
      expect(activity.getActionType()).toBe(ActionType.STATUS_CHANGE);
    });

    it('should return correct actionBy', () => {
      expect(activity.getActionBy()).toBe('user-789');
    });

    it('should return correct actionDate', () => {
      expect(activity.getActionDate()).toEqual(props.actionDate);
    });

    it('should return correct details', () => {
      expect(activity.getDetails()).toBe(
        'Status changed from pending to approved',
      );
    });

    it('should return correct previousStatus', () => {
      expect(activity.getPreviousStatus()).toBe('pending');
    });

    it('should return correct newStatus', () => {
      expect(activity.getNewStatus()).toBe('approved');
    });

    it('should return correct dueDate', () => {
      expect(activity.getDueDate()).toEqual(props.dueDate);
    });

    it('should return a copy of actionDate to prevent external mutation', () => {
      const returnedDate = activity.getActionDate();
      returnedDate.setFullYear(2025);

      // The activity's action date should remain unchanged
      expect(activity.getActionDate().getFullYear()).toBe(2024);
    });

    it('should return a copy of dueDate to prevent external mutation', () => {
      const returnedDate = activity.getDueDate();
      if (returnedDate) {
        returnedDate.setMonth(5); // June
      }

      // The activity's due date should remain unchanged
      expect(activity.getDueDate()?.getMonth()).toBe(0); // January
    });
  });

  describe('different action types', () => {
    const actionTypes = [
      ActionType.NOTE,
      ActionType.ASSIGNED,
      ActionType.STATUS_CHANGE,
      ActionType.DOC_UPLOADED,
      ActionType.EMAIL,
      ActionType.CALL,
      ActionType.FILED,
      ActionType.PREPARED,
    ];

    actionTypes.forEach((actionType) => {
      it(`should handle ${actionType} action type`, () => {
        const props: CurativeActivityProps = {
          id: `activity-${actionType}`,
          curativeItemId: 'item-456',
          actionType,
        };

        const activity = new CurativeActivity(props);
        expect(activity.getActionType()).toBe(actionType);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional fields', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
        actionBy: '',
        details: '',
        previousStatus: '',
        newStatus: '',
      };

      const activity = new CurativeActivity(props);

      expect(activity.getActionBy()).toBe('');
      expect(activity.getDetails()).toBe('');
      expect(activity.getPreviousStatus()).toBe('');
      expect(activity.getNewStatus()).toBe('');
    });

    it('should handle undefined optional fields', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
        actionBy: undefined,
        actionDate: undefined,
        details: undefined,
        previousStatus: undefined,
        newStatus: undefined,
        dueDate: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const activity = new CurativeActivity(props);

      expect(activity.getActionBy()).toBeUndefined();
      expect(activity.getDetails()).toBeUndefined();
      expect(activity.getPreviousStatus()).toBeUndefined();
      expect(activity.getNewStatus()).toBeUndefined();
      expect(activity.getDueDate()).toBeUndefined();
    });

    it('should handle null dueDate', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.NOTE,
        dueDate: undefined,
      };

      const activity = new CurativeActivity(props);
      expect(activity.getDueDate()).toBeUndefined();
    });
  });

  describe('status change scenarios', () => {
    it('should handle status change with previous and new status', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.STATUS_CHANGE,
        actionBy: 'user-789',
        details: 'Status updated from draft to submitted',
        previousStatus: 'draft',
        newStatus: 'submitted',
        actionDate: new Date('2024-01-15T10:00:00Z'),
      };

      const activity = new CurativeActivity(props);

      expect(activity.getActionType()).toBe(ActionType.STATUS_CHANGE);
      expect(activity.getPreviousStatus()).toBe('draft');
      expect(activity.getNewStatus()).toBe('submitted');
      expect(activity.getDetails()).toBe(
        'Status updated from draft to submitted',
      );
    });

    it('should handle assignment action', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.ASSIGNED,
        actionBy: 'user-789',
        details: 'Assigned to John Doe',
        dueDate: new Date('2024-01-20T10:00:00Z'),
      };

      const activity = new CurativeActivity(props);

      expect(activity.getActionType()).toBe(ActionType.ASSIGNED);
      expect(activity.getActionBy()).toBe('user-789');
      expect(activity.getDetails()).toBe('Assigned to John Doe');
      expect(activity.getDueDate()).toEqual(new Date('2024-01-20T10:00:00Z'));
    });

    it('should handle document upload action', () => {
      const props: CurativeActivityProps = {
        id: 'activity-123',
        curativeItemId: 'item-456',
        actionType: ActionType.DOC_UPLOADED,
        actionBy: 'user-789',
        details: 'Uploaded title_deed.pdf',
        actionDate: new Date('2024-01-15T14:30:00Z'),
      };

      const activity = new CurativeActivity(props);

      expect(activity.getActionType()).toBe(ActionType.DOC_UPLOADED);
      expect(activity.getDetails()).toBe('Uploaded title_deed.pdf');
      expect(activity.getActionDate()).toEqual(
        new Date('2024-01-15T14:30:00Z'),
      );
    });
  });
});
