import { RevenueDistributionCalculatedEvent } from '../revenue-distribution-calculated.event';

describe('RevenueDistributionCalculatedEvent', () => {
  it('should be defined', () => {
    const event = new RevenueDistributionCalculatedEvent(
      'dist-123',
      'org-456',
      'well-789',
      'partner-101',
      '2024-01',
      1500.5,
      'user-202',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('RevenueDistributionCalculated');
    expect(event.revenueDistributionId).toBe('dist-123');
    expect(event.netRevenue).toBe(1500.5);
  });
});
