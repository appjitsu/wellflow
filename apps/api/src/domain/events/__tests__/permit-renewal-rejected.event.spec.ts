import { PermitRenewalRejectedEvent } from '../permit-renewal-rejected.event';

describe('PermitRenewalRejectedEvent', () => {
  let event: PermitRenewalRejectedEvent;

  beforeEach(() => {
    event = new PermitRenewalRejectedEvent(
      'agg-123',
      'user-456',
      'Invalid documents',
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.aggregateId).toBe('agg-123');
    expect(event.rejectedByUserId).toBe('user-456');
    expect(event.rejectionReason).toBe('Invalid documents');
    expect(event.eventType).toBe('PermitRenewalRejected');
    expect(event.aggregateType).toBe('Permit');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
