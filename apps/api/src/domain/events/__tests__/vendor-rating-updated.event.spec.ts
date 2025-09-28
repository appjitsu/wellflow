import { VendorRatingUpdatedEvent } from '../vendor-rating-updated.event';
import { VendorRating } from '../../enums/vendor-status.enum';

describe('VendorRatingUpdatedEvent', () => {
  it('should be defined', () => {
    const event = new VendorRatingUpdatedEvent(
      'vendor1',
      'org1',
      VendorRating.EXCELLENT,
      VendorRating.GOOD,
      'user1',
    );
    expect(event).toBeDefined();
    expect(event.vendorId).toBe('vendor1');
    expect(event.oldRating).toBe(VendorRating.EXCELLENT);
    expect(event.newRating).toBe(VendorRating.GOOD);
  });
});
