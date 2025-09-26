export class CreateJoaCommand {
  constructor(
    public readonly organizationId: string,
    public readonly agreementNumber: string,
    public readonly effectiveDate: string,
    public readonly options?: {
      endDate?: string | null;
      operatorOverheadPercent?: string | null;
      votingThresholdPercent?: string | null;
      nonConsentPenaltyPercent?: string | null;
      terms?: Record<string, unknown> | null;
    },
  ) {}
}
