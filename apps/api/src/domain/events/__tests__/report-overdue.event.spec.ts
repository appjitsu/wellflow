import { ReportOverdueEvent } from '../report-overdue.event';

describe('ReportOverdueEvent', () => {
  it('should create a valid event', () => {
    const event = new ReportOverdueEvent(
      'report-123',
      'PR',
      'TX_RRC',
      new Date('2023-02-01'),
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('ReportOverdue');
    expect(event.aggregateId).toBe('report-123');
  });
});
