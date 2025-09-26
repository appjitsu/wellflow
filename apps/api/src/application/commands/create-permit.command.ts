/**
 * Command to create a new permit
 */
export class CreatePermitCommand {
  constructor(
    public readonly permitNumber: string,
    public readonly permitType: string,
    public readonly organizationId: string,
    public readonly issuingAgency: string,
    public readonly createdByUserId: string,
    public readonly wellId?: string,
    public readonly regulatoryAuthority?: string,
    public readonly applicationDate?: Date,
    public readonly expirationDate?: Date,
    public readonly permitConditions?: Record<string, unknown>,
    public readonly complianceRequirements?: Record<string, unknown>,
    public readonly feeAmount?: number,
    public readonly bondAmount?: number,
    public readonly bondType?: string,
    public readonly location?: string,
    public readonly facilityId?: string,
    public readonly documentIds?: string[],
  ) {}
}
