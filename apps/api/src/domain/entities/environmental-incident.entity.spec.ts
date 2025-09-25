import { EnvironmentalIncident } from './environmental-incident.entity';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../enums/environmental-incident.enums';

const base = {
  id: '00000000-0000-0000-0000-000000000001',
  organizationId: '00000000-0000-0000-0000-000000000010',
  reportedByUserId: '00000000-0000-0000-0000-000000000020',
  incidentNumber: 'INC-0001',
  incidentType: IncidentType.SPILL,
  incidentDate: new Date('2024-01-02'),
  discoveryDate: new Date('2024-01-03'),
  location: 'Pad A - Tank 1',
  description: 'Minor spill observed near tank',
  severity: IncidentSeverity.LOW,
};

describe('EnvironmentalIncident (domain)', () => {
  it('creates OPEN incident and emits reported event', () => {
    const inc = new EnvironmentalIncident(base);
    expect(inc.getStatus()).toBe(IncidentStatus.OPEN);
    expect(inc.getDomainEvents().length).toBeGreaterThan(0);
  });

  it('allows valid status transitions', () => {
    const inc = new EnvironmentalIncident(base);
    inc.changeStatus(IncidentStatus.INVESTIGATING, 'Initial triage');
    expect(inc.getStatus()).toBe(IncidentStatus.INVESTIGATING);
    inc.changeStatus(IncidentStatus.REMEDIATION, 'Containment started');
    expect(inc.getStatus()).toBe(IncidentStatus.REMEDIATION);
  });

  it('rejects invalid status transitions', () => {
    const inc = new EnvironmentalIncident(base);
    expect(() => inc.changeStatus(IncidentStatus.CLOSED)).toThrow();
  });

  it('adds remediation actions and can close after at least one action', () => {
    const inc = new EnvironmentalIncident(base);
    expect(() => inc.close()).toThrow();
    inc.addRemediationAction({
      description: 'Deployed absorbent pads',
      performedBy: 'tech-1',
      performedAt: new Date('2024-01-03T10:00:00Z'),
      status: 'complete',
    });
    inc.changeStatus(IncidentStatus.REMEDIATION, 'Containment complete');
    inc.close();
    expect(inc.getStatus()).toBe(IncidentStatus.CLOSED);
  });

  it('records regulatory notification', () => {
    const inc = new EnvironmentalIncident(base);
    inc.recordRegulatoryNotification('TCEQ', 'RPT-123', new Date('2024-01-04'));
    const events = inc.getDomainEvents();
    expect(
      events.some((e: any) =>
        e?.constructor?.name?.includes('RegulatoryNotifiedEvent'),
      ),
    ).toBe(true);
  });

  it('validates dates are not in the future and discovery after incident', () => {
    expect(
      () =>
        new EnvironmentalIncident({
          ...base,
          incidentDate: new Date(Date.now() + 86400000),
        }),
    ).toThrow();
    expect(
      () =>
        new EnvironmentalIncident({
          ...base,
          discoveryDate: new Date('2023-12-31'),
        }),
    ).toThrow();
  });
});
