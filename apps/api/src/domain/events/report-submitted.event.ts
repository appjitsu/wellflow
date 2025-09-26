import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a regulatory report is submitted to a regulatory agency
 */
export class ReportSubmittedEvent implements DomainEvent {
  public readonly eventType = 'ReportSubmitted';
  public readonly aggregateType = 'RegulatoryReport';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reportType: string,
    public readonly regulatoryAgency: string,
    public readonly externalSubmissionId?: string,
  ) {
    this.occurredOn = new Date();
  }
}
