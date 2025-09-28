import { ComplianceLimitExceededEvent } from '../compliance-limit-exceeded.event';

describe('ComplianceLimitExceededEvent', () => {
  it('should create a valid event', () => {
    const event = new ComplianceLimitExceededEvent(
      'monitor-123',
      'point-456',
      'NOx',
      150,
      100,
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('ComplianceLimitExceeded');
    expect(event.aggregateId).toBe('monitor-123');
  });
});
