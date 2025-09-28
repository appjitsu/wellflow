import { LosFinalizedEvent } from '../los-finalized.event';

describe('LosFinalizedEvent', () => {
  let event: LosFinalizedEvent;

  beforeEach(() => {
    event = new LosFinalizedEvent(
      'los-123',
      'org-123',
      'lease-123',
      '2024-01',
      15000.0,
      12000.0,
      3000.0,
      'user-123',
      { approved: true },
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct event type', () => {
    expect(event.eventType).toBe('LosFinalized');
  });

  it('should have occurred at timestamp', () => {
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should store all constructor parameters', () => {
    expect(event.losId).toBe('los-123');
    expect(event.organizationId).toBe('org-123');
    expect(event.leaseId).toBe('lease-123');
    expect(event.statementMonth).toBe('2024-01');
    expect(event.totalExpenses).toBe(15000.0);
    expect(event.operatingExpenses).toBe(12000.0);
    expect(event.capitalExpenses).toBe(3000.0);
    expect(event.finalizedBy).toBe('user-123');
    expect(event.metadata).toEqual({ approved: true });
  });

  it('should have a meaningful toString representation', () => {
    const result = event.toString();
    expect(result).toContain('los-123');
    expect(result).toContain('user-123');
    expect(result).toContain('2024-01');
    expect(result).toContain('$15,000');
  });
});
