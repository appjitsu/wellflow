import { PermitExpiredEvent } from '../permit-expired.event';

describe('PermitExpiredEvent', () => {
  let event: PermitExpiredEvent;

  beforeEach(() => {
    event = new PermitExpiredEvent('agg-123', 'permit-456');
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.aggregateId).toBe('agg-123');
    expect(event.permitNumber).toBe('permit-456');
    expect(event.eventType).toBe('PermitExpired');
    expect(event.aggregateType).toBe('Permit');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
