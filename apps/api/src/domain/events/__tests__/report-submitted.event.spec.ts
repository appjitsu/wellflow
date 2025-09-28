import { ReportSubmittedEvent } from '../report-submitted.event';

describe('ReportSubmittedEvent', () => {
  it('should create a valid event', () => {
    const event = new ReportSubmittedEvent(
      'report-123',
      'PR',
      'TX_RRC',
      'ext-456',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('ReportSubmitted');
    expect(event.aggregateId).toBe('report-123');
  });
});
