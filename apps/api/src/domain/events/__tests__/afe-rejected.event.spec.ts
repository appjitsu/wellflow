import { AfeRejectedEvent } from '../afe-rejected.event';

describe('AfeRejectedEvent', () => {
  let event: AfeRejectedEvent;

  beforeEach(() => {
    event = new AfeRejectedEvent('test-afe-id', 'test-org-id', 'AFE-001');
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.afeId).toBe('test-afe-id');
    expect(event.organizationId).toBe('test-org-id');
    expect(event.afeNumber).toBe('AFE-001');
    expect(event.eventType).toBe('AfeRejected');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
