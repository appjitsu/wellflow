import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a regulatory report is generated
 */
export class ReportGeneratedEvent implements DomainEvent {
  public readonly eventType = 'ReportGenerated';
  public readonly aggregateType = 'RegulatoryReport';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reportType: string,
    public readonly regulatoryAgency: string,
    public readonly reportData: Record<string, unknown>,
  ) {
    this.occurredOn = new Date();
  }
}
