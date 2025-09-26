import { randomUUID } from 'crypto';

export type OwnerPaymentStatus =
  | 'PENDING'
  | 'PROCESSED'
  | 'CLEARED'
  | 'VOID'
  | 'REVERSED'
  | 'FAILED';

export type OwnerPaymentMethod = 'CHECK' | 'ACH' | 'WIRE';

export interface OwnerPaymentProps {
  id?: string;
  organizationId: string;
  partnerId: string; // owner (royalty or WI) is modeled as a partner
  revenueDistributionId: string;
  method: OwnerPaymentMethod;
  status: OwnerPaymentStatus;
  grossAmount: string; // use string for exact decimal transfer; persistence layer enforces numeric(12,2)
  deductionsAmount?: string | null;
  taxWithheldAmount?: string | null;
  netAmount: string;
  checkNumber?: string | null;
  achTraceNumber?: string | null;
  memo?: string | null;
  paymentDate?: Date | null;
  clearedDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OwnerPayment {
  private readonly id: string;
  private readonly organizationId: string;
  private readonly partnerId: string;
  private readonly revenueDistributionId: string;
  private readonly method: OwnerPaymentMethod;
  private status: OwnerPaymentStatus;
  private readonly grossAmount: string;
  private readonly deductionsAmount: string | null;
  private readonly taxWithheldAmount: string | null;
  private readonly netAmount: string;
  private readonly checkNumber: string | null;
  private readonly achTraceNumber: string | null;
  private readonly memo: string | null;
  private readonly paymentDate: Date | null;
  private clearedDate: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: OwnerPaymentProps) {
    this.id = props.id ?? randomUUID();
    this.organizationId = props.organizationId;
    this.partnerId = props.partnerId;
    this.revenueDistributionId = props.revenueDistributionId;
    this.method = props.method;
    this.status = props.status;
    this.grossAmount = props.grossAmount;
    this.deductionsAmount = props.deductionsAmount ?? null;
    this.taxWithheldAmount = props.taxWithheldAmount ?? null;
    this.netAmount = props.netAmount;
    this.checkNumber = props.checkNumber ?? null;
    this.achTraceNumber = props.achTraceNumber ?? null;
    this.memo = props.memo ?? null;
    this.paymentDate = props.paymentDate ?? null;
    this.clearedDate = props.clearedDate ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  static fromPersistence(row: OwnerPaymentProps): OwnerPayment {
    return new OwnerPayment(row);
  }

  toPersistence(): OwnerPaymentProps {
    return {
      id: this.id,
      organizationId: this.organizationId,
      partnerId: this.partnerId,
      revenueDistributionId: this.revenueDistributionId,
      method: this.method,
      status: this.status,
      grossAmount: this.grossAmount,
      deductionsAmount: this.deductionsAmount,
      taxWithheldAmount: this.taxWithheldAmount,
      netAmount: this.netAmount,
      checkNumber: this.checkNumber,
      achTraceNumber: this.achTraceNumber,
      memo: this.memo,
      paymentDate: this.paymentDate,
      clearedDate: this.clearedDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private validate() {
    if (!this.organizationId) throw new Error('organizationId is required');
    if (!this.partnerId) throw new Error('partnerId is required');
    if (!this.method) throw new Error('method is required');
    if (!this.status) throw new Error('status is required');
    if (!/^-?\d+\.\d{2}$/.test(this.grossAmount))
      throw new Error('grossAmount must be a decimal string with 2 digits');
    if (!/^-?\d+\.\d{2}$/.test(this.netAmount))
      throw new Error('netAmount must be a decimal string with 2 digits');
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
  getStatus(): OwnerPaymentStatus {
    return this.status;
  }
  markProcessed() {
    this.status = 'PROCESSED';
    this.updatedAt = new Date();
  }
  markCleared(date: Date) {
    this.status = 'CLEARED';
    this.clearedDate = date;
    this.updatedAt = new Date();
  }
  voidPayment() {
    this.status = 'VOID';
    this.updatedAt = new Date();
  }
}
