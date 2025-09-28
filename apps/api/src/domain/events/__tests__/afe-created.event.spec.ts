import { AfeCreatedEvent } from '../afe-created.event';
import { AfeType } from '../../enums/afe-status.enum';

describe('AfeCreatedEvent', () => {
  it('should create event with correct properties', () => {
    const afeId = 'test-afe-id';
    const organizationId = 'test-org-id';
    const afeNumber = 'AFE-001';
    const afeType = AfeType.DRILLING;
    const estimatedCost = 10000;
    const metadata = { key: 'value' };

    const event = new AfeCreatedEvent(
      afeId,
      organizationId,
      afeNumber,
      afeType,
      estimatedCost,
      metadata,
    );

    expect(event.afeId).toBe(afeId);
    expect(event.organizationId).toBe(organizationId);
    expect(event.afeNumber).toBe(afeNumber);
    expect(event.afeType).toBe(afeType);
    expect(event.estimatedCost).toBe(estimatedCost);
    expect(event.metadata).toBe(metadata);
    expect(event.eventType).toBe('AfeCreated');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should create event without optional parameters', () => {
    const event = new AfeCreatedEvent(
      'afe-id',
      'org-id',
      'AFE-002',
      AfeType.COMPLETION,
    );

    expect(event.estimatedCost).toBeUndefined();
    expect(event.metadata).toBeUndefined();
  });

  it('should have correct toString representation', () => {
    const event = new AfeCreatedEvent(
      'afe-id',
      'org-id',
      'AFE-003',
      AfeType.WORKOVER,
    );

    expect(event.toString()).toBe(
      'AFE AFE-003 (workover) created for organization org-id',
    );
  });
});
