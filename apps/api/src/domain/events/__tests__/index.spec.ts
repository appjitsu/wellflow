import * as Events from '../index';

describe('Domain Events Index', () => {
  it('should export all domain events', () => {
    expect(Events.PermitCreatedEvent).toBeDefined();
    expect(Events.PermitStatusChangedEvent).toBeDefined();
    expect(Events.PermitExpiredEvent).toBeDefined();
    expect(Events.IncidentReportedEvent).toBeDefined();
    expect(Events.IncidentSeverityChangedEvent).toBeDefined();
    expect(Events.ReportOverdueEvent).toBeDefined();
    expect(Events.MonitoringDataRecordedEvent).toBeDefined();
    expect(Events.ComplianceLimitExceededEvent).toBeDefined();
  });
});
