import { DrillingProgramCreatedEvent } from '../drilling-program-created.event';

describe('DrillingProgramCreatedEvent', () => {
  it('should be defined', () => {
    expect(DrillingProgramCreatedEvent).toBeDefined();
  });

  it('should create event with required properties', () => {
    const event = new DrillingProgramCreatedEvent(
      'program-123',
      'org-456',
      'well-789',
      'Test Program',
    );

    expect(event.id).toBe('program-123');
    expect(event.organizationId).toBe('org-456');
    expect(event.wellId).toBe('well-789');
    expect(event.programName).toBe('Test Program');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
