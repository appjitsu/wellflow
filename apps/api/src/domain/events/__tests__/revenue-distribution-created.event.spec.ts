import { RevenueDistributionCreatedEvent } from '../revenue-distribution-created.event';

describe('RevenueDistributionCreatedEvent', () => {
  it('should be defined', () => {
    const event = new RevenueDistributionCreatedEvent(
      'dist-123',
      'org-456',
      'well-789',
      'partner-101',
      '2024-01',
      1500.5,
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('RevenueDistributionCreated');
    expect(event.revenueDistributionId).toBe('dist-123');
    expect(event.netRevenue).toBe(1500.5);
  });
});
