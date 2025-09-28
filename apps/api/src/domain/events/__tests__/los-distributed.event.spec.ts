import { LosDistributedEvent } from '../los-distributed.event';

describe('LosDistributedEvent', () => {
  it('should create a valid event', () => {
    const event = new LosDistributedEvent(
      'los-123',
      'org-456',
      'lease-789',
      '2023-01',
      10000,
      'user-123',
      'email',
      5,
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('LosDistributed');
    expect(event.losId).toBe('los-123');
  });
});
