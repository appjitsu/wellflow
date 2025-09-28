import { VendorCreatedEvent } from '../vendor-created.event';
import { VendorType } from '../../enums/vendor-status.enum';

describe('VendorCreatedEvent', () => {
  it('should create a valid event', () => {
    const event = new VendorCreatedEvent(
      'vendor-123',
      'org-456',
      'Test Vendor',
      VendorType.SERVICE,
      'V001',
      'user-789',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('VendorCreated');
    expect(event.vendorId).toBe('vendor-123');
  });
});
