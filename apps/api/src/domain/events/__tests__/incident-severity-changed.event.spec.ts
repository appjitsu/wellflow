import { IncidentSeverityChangedEvent } from '../incident-severity-changed.event';

describe('IncidentSeverityChangedEvent', () => {
  it('should be defined', () => {
    expect(IncidentSeverityChangedEvent).toBeDefined();
  });

  it('should create event with required properties', () => {
    const event = new IncidentSeverityChangedEvent(
      'incident-123',
      'LOW',
      'HIGH',
    );

    expect(event.aggregateId).toBe('incident-123');
    expect(event.oldSeverity).toBe('LOW');
    expect(event.newSeverity).toBe('HIGH');
    expect(event.eventType).toBe('IncidentSeverityChanged');
    expect(event.aggregateType).toBe('HSEIncident');
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
