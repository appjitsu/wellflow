import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when an HSE incident severity changes
 */
export class IncidentSeverityChangedEvent implements DomainEvent {
  public readonly eventType = 'IncidentSeverityChanged';
  public readonly aggregateType = 'HSEIncident';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly oldSeverity: string,
    public readonly newSeverity: string,
  ) {
    this.occurredOn = new Date();
  }
}
