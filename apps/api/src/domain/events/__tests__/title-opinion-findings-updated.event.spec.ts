import { TitleOpinionFindingsUpdatedEvent } from '../title-opinion-findings-updated.event';

describe('TitleOpinionFindingsUpdatedEvent', () => {
  it('should be defined', () => {
    const event = new TitleOpinionFindingsUpdatedEvent(
      'opinion-123',
      'user-456',
      'Old findings',
      'New findings',
      'Old recs',
      'New recs',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('TitleOpinionFindingsUpdated');
    expect(event.titleOpinionId).toBe('opinion-123');
    expect(event.updatedBy).toBe('user-456');
  });
});
