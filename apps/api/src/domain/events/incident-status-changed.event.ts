import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when an HSE incident status changes
 */
export class IncidentStatusChangedEvent implements DomainEvent {
  public readonly eventType = 'IncidentStatusChanged';
  public readonly aggregateType = 'HSEIncident';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {
    this.occurredOn = new Date();
  }
}
