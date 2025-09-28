import { CurativeItemDueDateChangedEvent } from '../curative-item-due-date-changed.event';

describe('CurativeItemDueDateChangedEvent', () => {
  let event: CurativeItemDueDateChangedEvent;

  beforeEach(() => {
    const prevDate = new Date('2023-01-01');
    const newDate = new Date('2023-02-01');
    event = new CurativeItemDueDateChangedEvent(
      'item-123',
      'updater-789',
      prevDate,
      newDate,
      { key: 'value' },
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.curativeItemId).toBe('item-123');
    expect(event.updatedBy).toBe('updater-789');
    expect(event.previousDueDate).toEqual(new Date('2023-01-01'));
    expect(event.newDueDate).toEqual(new Date('2023-02-01'));
    expect(event.metadata).toEqual({ key: 'value' });
    expect(event.eventType).toBe('CurativeItemDueDateChanged');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate correct string representation', () => {
    const str = event.toString();
    expect(str).toContain('item-123');
    expect(str).toContain('2023-01-01');
    expect(str).toContain('2023-02-01');
    expect(str).toContain('updater-789');
  });
});
