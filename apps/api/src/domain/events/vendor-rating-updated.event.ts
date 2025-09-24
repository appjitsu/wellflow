import { VendorRating } from '../enums/vendor-status.enum';

/**
 * Vendor Rating Updated Domain Event
 * Raised when a vendor's performance rating is updated
 */
export class VendorRatingUpdatedEvent {
  public readonly eventType = 'VendorRatingUpdated';
  public readonly occurredAt: Date;

  constructor(
    public readonly vendorId: string,
    public readonly organizationId: string,
    public readonly oldRating: VendorRating,
    public readonly newRating: VendorRating,
    public readonly evaluatedBy: string,
    public readonly evaluationNotes?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Vendor ${this.vendorId} rating updated from ${this.oldRating} to ${this.newRating} by ${this.evaluatedBy}`;
  }
}
