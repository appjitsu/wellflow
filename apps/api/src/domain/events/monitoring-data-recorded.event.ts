import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when environmental monitoring data is recorded
 */
export class MonitoringDataRecordedEvent implements DomainEvent {
  public readonly eventType = 'MonitoringDataRecorded';
  public readonly aggregateType = 'EnvironmentalMonitoring';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly monitoringPointId: string,
    public readonly parameter: string,
    public readonly measuredValue?: number,
  ) {
    this.occurredOn = new Date();
  }
}
