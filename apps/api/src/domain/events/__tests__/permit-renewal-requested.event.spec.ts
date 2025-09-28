import { PermitRenewalRequestedEvent } from '../permit-renewal-requested.event';

describe('PermitRenewalRequestedEvent', () => {
  let event: PermitRenewalRequestedEvent;

  beforeEach(() => {
    event = new PermitRenewalRequestedEvent(
      'permit-123',
      'user-123',
      new Date('2024-12-31'),
      'Annual renewal',
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct event type', () => {
    expect(event.eventType).toBe('PermitRenewalRequested');
  });

  it('should have correct aggregate type', () => {
    expect(event.aggregateType).toBe('Permit');
  });

  it('should have occurred on timestamp', () => {
    expect(event.occurredOn).toBeInstanceOf(Date);
  });

  it('should store all constructor parameters', () => {
    expect(event.aggregateId).toBe('permit-123');
    expect(event.requestedByUserId).toBe('user-123');
    expect(event.newExpirationDate).toEqual(new Date('2024-12-31'));
    expect(event.renewalReason).toBe('Annual renewal');
  });
});
