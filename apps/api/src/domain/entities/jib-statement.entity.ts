export interface JibStatementProps {
  id?: string;
  organizationId: string;
  leaseId: string;
  partnerId: string;
  statementPeriodStart?: string; // YYYY-MM-DD (optional to preserve backward-compat in tests)
  statementPeriodEnd: string; // YYYY-MM-DD
  grossRevenue?: string; // 12,2
  netRevenue?: string; // 12,2
  workingInterestShare?: string; // 12,2
  royaltyShare?: string; // 12,2
  lineItems?: JibLineItem[] | null;
  status?: 'draft' | 'sent' | 'paid';
  sentAt?: Date | null;
  paidAt?: Date | null;
  previousBalance?: string; // 12,2
  currentBalance: string; // 12,2
  dueDate?: string | null; // YYYY-MM-DD
  cashCallId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type JibLineItem = {
  type: 'revenue' | 'expense';
  description: string;
  amount?: string; // 12,2 optional
  quantity?: string; // up to 3 dp
  unitCost?: string; // 12,2 optional
};

export function isJibLineItem(value: unknown): value is JibLineItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.type !== 'revenue' && candidate.type !== 'expense') {
    return false;
  }

  if (typeof candidate.description !== 'string') {
    return false;
  }

  const { amount, quantity, unitCost } = candidate;
  const isOptionalString = (input: unknown) =>
    input === undefined || input === null || typeof input === 'string';

  return (
    isOptionalString(amount) &&
    isOptionalString(quantity) &&
    isOptionalString(unitCost)
  );
}

export function deserializeLineItems(value: unknown): JibLineItem[] | null {
  if (value == null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const normalized: JibLineItem[] = [];
  for (const item of value) {
    if (!isJibLineItem(item)) {
      return null;
    }
    normalized.push({
      type: item.type,
      description: item.description,
      amount: item.amount ?? undefined,
      quantity: item.quantity ?? undefined,
      unitCost: item.unitCost ?? undefined,
    });
  }

  return normalized;
}

export class JibStatement {
  private readonly id?: string;
  private readonly organizationId: string;
  private readonly leaseId: string;
  private readonly partnerId: string;
  private statementPeriodStart: string | undefined;
  private statementPeriodEnd: string;
  private grossRevenue: string;
  private netRevenue: string;
  private workingInterestShare: string;
  private royaltyShare: string;
  private lineItems: JibLineItem[] | null;
  private status: 'draft' | 'sent' | 'paid';
  private sentAt: Date | null;
  private paidAt: Date | null;
  private previousBalance: string;
  private dueDate: string | null;
  private currentBalance: string;
  private cashCallId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: JibStatementProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.leaseId = props.leaseId;
    this.partnerId = props.partnerId;
    this.statementPeriodStart = props.statementPeriodStart;
    this.statementPeriodEnd = props.statementPeriodEnd;
    this.grossRevenue = props.grossRevenue ?? '0.00';
    this.netRevenue = props.netRevenue ?? '0.00';
    this.workingInterestShare = props.workingInterestShare ?? '0.00';
    this.royaltyShare = props.royaltyShare ?? '0.00';
    this.lineItems = props.lineItems
      ? props.lineItems.map((item) => ({ ...item }))
      : null;
    this.status = props.status ?? 'draft';
    this.sentAt = props.sentAt ?? null;
    this.paidAt = props.paidAt ?? null;
    this.previousBalance = props.previousBalance ?? '0.00';
    this.dueDate = props.dueDate ?? null;
    this.currentBalance = props.currentBalance;
    this.cashCallId = props.cashCallId ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  getId() {
    return this.id ?? '';
  }
  getOrganizationId() {
    return this.organizationId;
  }
  getLeaseId() {
    return this.leaseId;
  }
  getPartnerId() {
    return this.partnerId;
  }
  getStatementPeriodStart() {
    return this.statementPeriodStart;
  }
  getStatementPeriodEnd() {
    return this.statementPeriodEnd;
  }
  getGrossRevenue() {
    return this.grossRevenue;
  }
  getNetRevenue() {
    return this.netRevenue;
  }
  getWorkingInterestShare() {
    return this.workingInterestShare;
  }
  getRoyaltyShare() {
    return this.royaltyShare;
  }
  getLineItems(): JibLineItem[] | null {
    return this.lineItems ? this.lineItems.map((item) => ({ ...item })) : null;
  }
  getStatus() {
    return this.status;
  }
  getSentAt() {
    return this.sentAt;
  }
  getPaidAt() {
    return this.paidAt;
  }
  getPreviousBalance() {
    return this.previousBalance;
  }
  getDueDate() {
    return this.dueDate;
  }
  getCurrentBalance() {
    return this.currentBalance;
  }
  getCashCallId() {
    return this.cashCallId;
  }

  linkCashCall(cashCallId: string) {
    this.cashCallId = cashCallId;
    this.updatedAt = new Date();
  }

  applyInterest(accrued: string) {
    const sum = (parseFloat(this.currentBalance) + parseFloat(accrued)).toFixed(
      2,
    );
    this.currentBalance = sum;
    this.updatedAt = new Date();
  }

  toPersistence(): JibStatementProps {
    return {
      id: this.id,
      organizationId: this.organizationId,
      leaseId: this.leaseId,
      partnerId: this.partnerId,
      statementPeriodStart: this.statementPeriodStart,
      statementPeriodEnd: this.statementPeriodEnd,
      grossRevenue: this.grossRevenue,
      netRevenue: this.netRevenue,
      workingInterestShare: this.workingInterestShare,
      royaltyShare: this.royaltyShare,
      lineItems: this.lineItems,
      status: this.status,
      sentAt: this.sentAt,
      paidAt: this.paidAt,
      previousBalance: this.previousBalance,
      dueDate: this.dueDate,
      currentBalance: this.currentBalance,
      cashCallId: this.cashCallId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static resolveLineItemAmount(item: JibLineItem): number {
    const hasAmount = typeof item.amount === 'string' && item.amount.length > 0;
    if (hasAmount) {
      return JibStatement.parseDecimal(item.amount);
    }

    const hasQuantity =
      typeof item.quantity === 'string' && item.quantity.length > 0;
    const hasUnitCost =
      typeof item.unitCost === 'string' && item.unitCost.length > 0;

    if (hasQuantity && hasUnitCost) {
      const quantity = JibStatement.parseDecimal(item.quantity);
      const unitCost = JibStatement.parseDecimal(item.unitCost);
      return quantity * unitCost;
    }

    throw new Error('Line item must include amount or quantity and unitCost');
  }

  private static parseDecimal(value: string | undefined | null): number {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error('Expected non-empty decimal string');
    }

    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new Error('Line item amounts must be non-negative decimal strings');
    }

    return parsed;
  }

  // Domain-level computation from typed line items
  static computeTotals(items: ReadonlyArray<JibLineItem>): {
    grossRevenue: string;
    netRevenue: string;
  } {
    let revenue = 0;
    let expense = 0;

    for (const item of items) {
      const amount = this.resolveLineItemAmount(item);
      if (item.type === 'revenue') {
        revenue += amount;
      } else {
        expense += amount;
      }
    }

    const gross = revenue;
    const net = revenue - expense;
    return { grossRevenue: gross.toFixed(2), netRevenue: net.toFixed(2) };
  }
}
