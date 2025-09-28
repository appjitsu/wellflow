import { RevenueDistributionPaidEvent } from '../revenue-distribution-paid.event';

describe('RevenueDistributionPaidEvent', () => {
  it('should be defined', () => {
    const event = new RevenueDistributionPaidEvent(
      'dist-123',
      'org-456',
      'well-789',
      'partner-101',
      '2024-01',
      1500.5,
      'CHK-001',
      new Date('2024-02-01'),
      'user-202',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('RevenueDistributionPaid');
    expect(event.revenueDistributionId).toBe('dist-123');
    expect(event.checkNumber).toBe('CHK-001');
  });
});
