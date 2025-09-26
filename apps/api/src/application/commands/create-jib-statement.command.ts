export type CreateJibOptional = {
  grossRevenue?: string;
  netRevenue?: string;
  workingInterestShare?: string;
  royaltyShare?: string;
  previousBalance?: string;
  currentBalance?: string;
  lineItems?:
    | {
        type: 'revenue' | 'expense';
        description: string;
        amount?: string;
        quantity?: string;
        unitCost?: string;
      }[]
    | null;
  status?: 'draft' | 'sent' | 'paid';
  sentAt?: string | null;
  paidAt?: string | null;
};

export class CreateJibStatementCommand {
  constructor(
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly partnerId: string,
    public readonly statementPeriodStart: string, // YYYY-MM-DD
    public readonly statementPeriodEnd: string, // YYYY-MM-DD
    public readonly dueDate?: string | null,
    public readonly optional?: CreateJibOptional,
  ) {}
}
