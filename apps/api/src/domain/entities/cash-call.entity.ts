import { randomUUID } from 'crypto';

export type CashCallStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'DEFAULTED';
export type CashCallType = 'MONTHLY' | 'SUPPLEMENTAL';

export type CashCallConsentStatus =
  | 'NOT_REQUIRED'
  | 'REQUIRED'
  | 'RECEIVED'
  | 'WAIVED';

export interface CashCallProps {
  id?: string;
  organizationId: string;
  leaseId: string;
  partnerId: string;
  billingMonth: string;
  dueDate?: string | null;
  amount: string;
  type: CashCallType;
  status: CashCallStatus;
  interestRatePercent?: string | null; // up to 5,2
  consentRequired: boolean;
  consentStatus?: CashCallConsentStatus;
  consentReceivedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CashCall {
  private readonly id: string;
  private readonly organizationId: string;
  private readonly leaseId: string;
  private readonly partnerId: string;
  private readonly billingMonth: string;
  private dueDate: string | null;
  private amount: string;
  private readonly type: CashCallType;
  private status: CashCallStatus;
  private readonly interestRatePercent: string | null;
  private readonly consentRequired: boolean;
  private consentStatus: CashCallConsentStatus;
  private consentReceivedAt: Date | null;
  private approvedAt: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: CashCallProps) {
    this.id = props.id ?? randomUUID();
    this.organizationId = props.organizationId;
    this.leaseId = props.leaseId;
    this.partnerId = props.partnerId;
    this.billingMonth = props.billingMonth;
    this.dueDate = props.dueDate ?? null;
    this.amount = props.amount;
    this.type = props.type;
    this.status = props.status;
    this.interestRatePercent = props.interestRatePercent ?? null;
    this.consentRequired = props.consentRequired;
    this.consentStatus =
      props.consentStatus ??
      (this.consentRequired ? 'REQUIRED' : 'NOT_REQUIRED');
    this.consentReceivedAt = props.consentReceivedAt ?? null;
    this.approvedAt = props.approvedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.validate();
  }

  static fromPersistence(row: CashCallProps): CashCall {
    return new CashCall(row);
  }

  toPersistence(): CashCallProps {
    return {
      id: this.id,
      organizationId: this.organizationId,
      leaseId: this.leaseId,
      partnerId: this.partnerId,
      billingMonth: this.billingMonth,
      dueDate: this.dueDate,
      amount: this.amount,
      type: this.type,
      status: this.status,
      interestRatePercent: this.interestRatePercent,
      consentRequired: this.consentRequired,
      consentStatus: this.consentStatus,
      consentReceivedAt: this.consentReceivedAt,
      approvedAt: this.approvedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getPartnerId(): string {
    return this.partnerId;
  }
  getLeaseId(): string {
    return this.leaseId;
  }

  private validate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.billingMonth))
      throw new Error('billingMonth must be YYYY-MM-DD');
    if (this.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(this.dueDate))
      throw new Error('dueDate must be YYYY-MM-DD');
    if (!/^-?\d+\.\d{2}$/.test(this.amount))
      throw new Error('amount must be decimal string');
  }

  approve() {
    this.status = 'APPROVED';
    this.approvedAt = new Date();
    this.updatedAt = new Date();
  }

  markSent() {
    this.status = 'SENT';
    this.updatedAt = new Date();
  }

  markPaid() {
    this.status = 'PAID';
    this.updatedAt = new Date();
  }

  recordConsent(status: CashCallConsentStatus, receivedAt?: Date | null) {
    this.consentStatus = status;
    this.consentReceivedAt =
      status === 'RECEIVED' ? (receivedAt ?? new Date()) : null;
    this.updatedAt = new Date();
  }
}
