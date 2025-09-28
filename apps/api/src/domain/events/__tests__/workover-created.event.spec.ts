import { WorkoverCreatedEvent } from '../workover-created.event';

describe('WorkoverCreatedEvent', () => {
  let event: WorkoverCreatedEvent;

  beforeEach(() => {
    event = new WorkoverCreatedEvent(
      'workover-123',
      'org-123',
      'well-123',
      'scheduled',
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have occurred at timestamp', () => {
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should store all constructor parameters', () => {
    expect(event.id).toBe('workover-123');
    expect(event.organizationId).toBe('org-123');
    expect(event.wellId).toBe('well-123');
    expect(event.status).toBe('scheduled');
  });
});
