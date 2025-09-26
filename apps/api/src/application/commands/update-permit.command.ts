/**
 * Command to update an existing permit
 */
export class UpdatePermitCommand {
  constructor(
    public readonly permitId: string,
    public readonly updatedByUserId: string,
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
