import { TitleOpinionStatusChangedEvent } from '../title-opinion-status-changed.event';

describe('TitleOpinionStatusChangedEvent', () => {
  it('should be defined', () => {
    const event = new TitleOpinionStatusChangedEvent(
      'opinion-123',
      'draft' as any,
      'approved' as any,
      'user-456',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('TitleOpinionStatusChanged');
    expect(event.titleOpinionId).toBe('opinion-123');
    expect(event.previousStatus).toBe('draft');
    expect(event.newStatus).toBe('approved');
  });
});
