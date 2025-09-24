import { VendorStatus } from '../enums/vendor-status.enum';

/**
 * Vendor Status Changed Domain Event
 * Raised when a vendor's status changes (e.g., pending to approved)
 */
export class VendorStatusChangedEvent {
  public readonly eventType = 'VendorStatusChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly vendorId: string,
    public readonly organizationId: string,
    public readonly oldStatus: VendorStatus,
    public readonly newStatus: VendorStatus,
    public readonly reason?: string,
    public readonly changedBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const reasonText = this.reason ? ` (${this.reason})` : '';
    return `Vendor ${this.vendorId} status changed from ${this.oldStatus} to ${this.newStatus}${reasonText}`;
  }
}
