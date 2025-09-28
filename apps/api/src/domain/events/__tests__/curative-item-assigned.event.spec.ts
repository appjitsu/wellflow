import { CurativeItemAssignedEvent } from '../curative-item-assigned.event';

describe('CurativeItemAssignedEvent', () => {
  let event: CurativeItemAssignedEvent;

  beforeEach(() => {
    event = new CurativeItemAssignedEvent(
      'item-123',
      'user-456',
      'updater-789',
      'prev-user-101',
      { key: 'value' },
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.curativeItemId).toBe('item-123');
    expect(event.newAssignee).toBe('user-456');
    expect(event.updatedBy).toBe('updater-789');
    expect(event.previousAssignee).toBe('prev-user-101');
    expect(event.metadata).toEqual({ key: 'value' });
    expect(event.eventType).toBe('CurativeItemAssigned');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate correct string representation', () => {
    const str = event.toString();
    expect(str).toContain('item-123');
    expect(str).toContain('user-456');
    expect(str).toContain('prev-user-101');
    expect(str).toContain('updater-789');
  });
});
