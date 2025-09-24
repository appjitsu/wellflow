import { VendorType } from '../enums/vendor-status.enum';

/**
 * Vendor Created Domain Event
 * Raised when a new vendor is created in the system
 */
export class VendorCreatedEvent {
  public readonly eventType = 'VendorCreated';
  public readonly occurredAt: Date;

  constructor(
    public readonly vendorId: string,
    public readonly organizationId: string,
    public readonly vendorName: string,
    public readonly vendorType: VendorType,
    public readonly vendorCode: string,
    public readonly createdBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Vendor ${this.vendorName} (${this.vendorCode}) created as ${this.vendorType} vendor`;
  }
}
