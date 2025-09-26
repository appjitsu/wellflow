import { randomUUID } from 'crypto';

export type JoaStatus = 'ACTIVE' | 'TERMINATED' | 'SUSPENDED';

export interface JoaProps {
  id?: string;
  organizationId: string;
  agreementNumber: string;
  effectiveDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  operatorOverheadPercent?: string | null; // 5,2
  votingThresholdPercent?: string | null; // 5,2
  nonConsentPenaltyPercent?: string | null; // 5,2
  status: JoaStatus;
  terms?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JointOperatingAgreement {
  private readonly id: string;
  private readonly organizationId: string;
  private agreementNumber: string;
  private effectiveDate: string;
  private endDate: string | null;
  private operatorOverheadPercent: string | null;
  private votingThresholdPercent: string | null;
  private nonConsentPenaltyPercent: string | null;
  private status: JoaStatus;
  private terms: Record<string, unknown> | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: JoaProps) {
    this.id = props.id ?? randomUUID();
    this.organizationId = props.organizationId;
    this.agreementNumber = props.agreementNumber;
    this.effectiveDate = props.effectiveDate;
    this.endDate = props.endDate ?? null;
    this.operatorOverheadPercent = props.operatorOverheadPercent ?? null;
    this.votingThresholdPercent = props.votingThresholdPercent ?? null;
    this.nonConsentPenaltyPercent = props.nonConsentPenaltyPercent ?? null;
    this.status = props.status;
    this.terms = props.terms ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();

    this.validate();
  }

  static fromPersistence(row: JoaProps): JointOperatingAgreement {
    return new JointOperatingAgreement(row);
  }

  toPersistence(): JoaProps {
    return {
      id: this.id,
      organizationId: this.organizationId,
      agreementNumber: this.agreementNumber,
      effectiveDate: this.effectiveDate,
      endDate: this.endDate,
      operatorOverheadPercent: this.operatorOverheadPercent,
      votingThresholdPercent: this.votingThresholdPercent,
      nonConsentPenaltyPercent: this.nonConsentPenaltyPercent,
      status: this.status,
      terms: this.terms ?? undefined,
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

  private validate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.effectiveDate))
      throw new Error('effectiveDate must be YYYY-MM-DD');
    if (this.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(this.endDate))
      throw new Error('endDate must be YYYY-MM-DD');
    if (!this.agreementNumber) throw new Error('agreementNumber is required');
  }

  suspend() {
    this.status = 'SUSPENDED';
    this.updatedAt = new Date();
  }
  terminate() {
    this.status = 'TERMINATED';
    this.updatedAt = new Date();
  }
}
