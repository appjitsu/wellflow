export class CreateOwnerPaymentCommand {
  constructor(
    public readonly organizationId: string,
    public readonly partnerId: string,
    public readonly method: 'CHECK' | 'ACH' | 'WIRE',
    public readonly grossAmount: string,
    public readonly netAmount: string,
    public readonly revenueDistributionId: string,
    public readonly options?: {
      deductionsAmount?: string;
      taxWithheldAmount?: string;
      checkNumber?: string;
      achTraceNumber?: string;
      memo?: string;
      paymentDate?: Date;
    },
  ) {}
}
