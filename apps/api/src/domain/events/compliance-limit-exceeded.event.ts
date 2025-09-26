import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when environmental monitoring data exceeds compliance limits
 */
export class ComplianceLimitExceededEvent implements DomainEvent {
  public readonly eventType = 'ComplianceLimitExceeded';
  public readonly aggregateType = 'EnvironmentalMonitoring';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly monitoringPointId: string,
    public readonly parameter: string,
    public readonly measuredValue: number,
    public readonly complianceLimit: number,
  ) {
    this.occurredOn = new Date();
  }
}
