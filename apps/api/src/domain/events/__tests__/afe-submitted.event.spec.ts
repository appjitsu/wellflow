import { AfeSubmittedEvent } from '../afe-submitted.event';
import { AfeType } from '../../enums/afe-status.enum';

describe('AfeSubmittedEvent', () => {
  it('should be defined', () => {
    const event = new AfeSubmittedEvent(
      'afe-123',
      'org-123',
      'AFE-001',
      AfeType.DRILLING,
      100000,
      'user-123',
    );
    expect(event).toBeDefined();
    expect(event.afeId).toBe('afe-123');
  });
});
