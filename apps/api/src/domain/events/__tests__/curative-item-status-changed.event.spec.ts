import { CurativeItemStatusChangedEvent } from '../curative-item-status-changed.event';
import { CurativeStatus } from '../../entities/curative-item.entity';

describe('CurativeItemStatusChangedEvent', () => {
  it('should create a valid event', () => {
    const event = new CurativeItemStatusChangedEvent(
      'item-123',
      CurativeStatus.OPEN,
      CurativeStatus.IN_PROGRESS,
      'user-456',
      'Status updated for processing',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('CurativeItemStatusChanged');
    expect(event.curativeItemId).toBe('item-123');
  });
});
