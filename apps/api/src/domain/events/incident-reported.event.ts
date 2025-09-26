import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a new HSE incident is reported
 */
export class IncidentReportedEvent implements DomainEvent {
  public readonly eventType = 'IncidentReported';
  public readonly aggregateType = 'HSEIncident';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly incidentNumber: string,
    public readonly incidentType: string,
    public readonly severity: string,
  ) {
    this.occurredOn = new Date();
  }
}
