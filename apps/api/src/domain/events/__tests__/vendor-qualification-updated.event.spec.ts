import { VendorQualificationUpdatedEvent } from '../vendor-qualification-updated.event';

describe('VendorQualificationUpdatedEvent', () => {
  it('should create a valid event', () => {
    const event = new VendorQualificationUpdatedEvent(
      'vendor-123',
      'org-456',
      'certification_added',
      'Added OSHA certification',
      'user-789',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('VendorQualificationUpdated');
    expect(event.vendorId).toBe('vendor-123');
  });
});
