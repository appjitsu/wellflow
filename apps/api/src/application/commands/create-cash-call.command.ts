export class CreateCashCallCommand {
  constructor(
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly partnerId: string,
    public readonly billingMonth: string, // YYYY-MM-DD
    public readonly amount: string, // 15,2 as string
    public readonly type: 'MONTHLY' | 'SUPPLEMENTAL',
    public readonly options?: {
      dueDate?: string | null;
      interestRatePercent?: string | null;
      consentRequired?: boolean;
    },
  ) {}
}
