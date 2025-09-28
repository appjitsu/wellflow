import { PermitCreatedEvent } from '../permit-created.event';

describe('PermitCreatedEvent', () => {
  let event: PermitCreatedEvent;

  beforeEach(() => {
    event = new PermitCreatedEvent('agg-123', 'permit-456', 'drilling');
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.aggregateId).toBe('agg-123');
    expect(event.permitNumber).toBe('permit-456');
    expect(event.permitType).toBe('drilling');
    expect(event.eventType).toBe('PermitCreated');
    expect(event.aggregateType).toBe('Permit');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
