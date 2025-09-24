import { AfeType } from '../enums/afe-status.enum';

/**
 * AFE Created Domain Event
 * Raised when a new AFE is created
 */
export class AfeCreatedEvent {
  public readonly eventType = 'AfeCreated';
  public readonly occurredAt: Date;

  constructor(
    public readonly afeId: string,
    public readonly organizationId: string,
    public readonly afeNumber: string,
    public readonly afeType: AfeType,
    public readonly estimatedCost?: number,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `AFE ${this.afeNumber} (${this.afeType}) created for organization ${this.organizationId}`;
  }
}
