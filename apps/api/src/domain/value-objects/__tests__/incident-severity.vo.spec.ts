import { IncidentSeverity } from '../incident-severity.vo';

describe('IncidentSeverity', () => {
  it('should create a valid incident severity', () => {
    const severity = IncidentSeverity.HIGH;
    expect(severity).toBeDefined();
    expect(severity.toString()).toBe('high');
  });

  it('should create severity from string', () => {
    const severity = IncidentSeverity.fromString('critical');
    expect(severity).toBe(IncidentSeverity.CRITICAL);
  });
});
