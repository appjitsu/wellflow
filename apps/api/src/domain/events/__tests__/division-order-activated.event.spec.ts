import { DivisionOrderActivatedEvent } from '../division-order-activated.event';

describe('DivisionOrderActivatedEvent', () => {
  it('should create a valid event', () => {
    const event = new DivisionOrderActivatedEvent(
      'do-123',
      'org-456',
      'well-789',
      'partner-101',
      'user-202',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('DivisionOrderActivated');
    expect(event.divisionOrderId).toBe('do-123');
  });
});
