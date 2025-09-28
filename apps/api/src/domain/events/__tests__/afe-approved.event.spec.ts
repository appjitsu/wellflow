import { AfeApprovedEvent } from '../afe-approved.event';

describe('AfeApprovedEvent', () => {
  let event: AfeApprovedEvent;

  beforeEach(() => {
    event = new AfeApprovedEvent(
      'afe-123',
      'org-456',
      'AFE-001',
      10000,
      'user-789',
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(event.afeId).toBe('afe-123');
    expect(event.organizationId).toBe('org-456');
    expect(event.afeNumber).toBe('AFE-001');
    expect(event.approvedAmount).toBe(10000);
    expect(event.approvedBy).toBe('user-789');
    expect(event.eventType).toBe('AfeApproved');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate correct string representation', () => {
    expect(event.toString()).toBe(
      'AFE AFE-001 approved for $10,000 by user-789',
    );
  });
});
