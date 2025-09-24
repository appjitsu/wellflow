/**
 * Vendor Qualification Updated Domain Event
 * Raised when a vendor's qualification status or certifications are updated
 */
export class VendorQualificationUpdatedEvent {
  public readonly eventType = 'VendorQualificationUpdated';
  public readonly occurredAt: Date;

  constructor(
    public readonly vendorId: string,
    public readonly organizationId: string,
    public readonly qualificationType: string, // 'certification_added', 'insurance_updated', etc.
    public readonly qualificationDetails: string,
    public readonly updatedBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Vendor ${this.vendorId} qualification updated: ${this.qualificationType} - ${this.qualificationDetails}`;
  }
}
