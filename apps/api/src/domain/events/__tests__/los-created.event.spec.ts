import { LosCreatedEvent } from '../los-created.event';

describe('LosCreatedEvent', () => {
  let event: LosCreatedEvent;

  beforeEach(() => {
    event = new LosCreatedEvent(
      'los-123',
      'org-456',
      'lease-789',
      '2024-01',
      10000,
      'user-101',
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.losId).toBe('los-123');
    expect(event.organizationId).toBe('org-456');
    expect(event.leaseId).toBe('lease-789');
    expect(event.statementMonth).toBe('2024-01');
    expect(event.totalExpenses).toBe(10000);
    expect(event.createdBy).toBe('user-101');
    expect(event.eventType).toBe('LosCreated');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate correct string representation', () => {
    expect(event.toString()).toBe(
      'Lease Operating Statement los-123 created for lease lease-789 for 2024-01',
    );
  });
});
