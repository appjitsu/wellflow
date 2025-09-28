import { IncidentReportedEvent } from '../incident-reported.event';

describe('IncidentReportedEvent', () => {
  it('should create a valid event', () => {
    const event = new IncidentReportedEvent(
      'incident-123',
      'INC-001',
      'SPILL',
      'HIGH',
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('IncidentReported');
    expect(event.aggregateId).toBe('incident-123');
  });
});
