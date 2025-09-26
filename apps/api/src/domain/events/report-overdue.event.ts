import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a regulatory report becomes overdue
 */
export class ReportOverdueEvent implements DomainEvent {
  public readonly eventType = 'ReportOverdue';
  public readonly aggregateType = 'RegulatoryReport';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reportType: string,
    public readonly regulatoryAgency: string,
    public readonly dueDate: Date,
  ) {
    this.occurredOn = new Date();
  }
}
