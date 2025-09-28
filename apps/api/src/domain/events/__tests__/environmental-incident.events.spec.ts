import { IncidentReportedEvent } from '../environmental-incident.events';
import {
  IncidentType,
  IncidentSeverity,
} from '../../enums/environmental-incident.enums';

describe('IncidentReportedEvent', () => {
  it('should create a valid event', () => {
    const event = new IncidentReportedEvent(
      'incident-123',
      'org-456',
      'INC-001',
      IncidentType.SPILL,
      IncidentSeverity.HIGH,
    );
    expect(event).toBeDefined();
    expect(event.incidentId).toBe('incident-123');
  });
});
