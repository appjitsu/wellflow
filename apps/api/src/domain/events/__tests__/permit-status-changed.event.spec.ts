import { PermitStatusChangedEvent } from '../permit-status-changed.event';

describe('PermitStatusChangedEvent', () => {
  it('should be defined', () => {
    const event = new PermitStatusChangedEvent(
      'permit-123',
      'pending',
      'approved',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('PermitStatusChanged');
    expect(event.aggregateId).toBe('permit-123');
    expect(event.oldStatus).toBe('pending');
    expect(event.newStatus).toBe('approved');
  });
});
