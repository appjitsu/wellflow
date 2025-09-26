export enum TitleStatus {
  CLEAR = 'clear',
  DEFECTIVE = 'defective',
  PENDING = 'pending',
}

export interface TitleOpinionProps {
  id: string;
  organizationId: string;
  leaseId: string;
  opinionNumber: string;
  examinerName: string;
  examinationDate: Date;
  effectiveDate: Date;
  titleStatus: TitleStatus;
  findings?: string;
  recommendations?: string;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

/**
 * TitleOpinion Entity - Aggregate Root for title examination
 */
export class TitleOpinion {
  private id: string;
  private organizationId: string;
  private leaseId: string;
  private opinionNumber: string;
  private examinerName: string;
  private examinationDate: Date;
  private effectiveDate: Date;
  private titleStatus: TitleStatus;
  private findings?: string;
  private recommendations?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;

  constructor(props: TitleOpinionProps) {
    this.ensureValidStatus(props.titleStatus);

    this.id = props.id;
    this.organizationId = props.organizationId;
    this.leaseId = props.leaseId;
    this.opinionNumber = props.opinionNumber;
    this.examinerName = props.examinerName;
    this.examinationDate = new Date(props.examinationDate.getTime());
    this.effectiveDate = new Date(props.effectiveDate.getTime());
    this.titleStatus = props.titleStatus;
    this.findings = props.findings;
    this.recommendations = props.recommendations;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.version = props.version ?? 1;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getLeaseId(): string {
    return this.leaseId;
  }
  getOpinionNumber(): string {
    return this.opinionNumber;
  }
  getExaminerName(): string {
    return this.examinerName;
  }
  getExaminationDate(): Date {
    return new Date(this.examinationDate);
  }
  getEffectiveDate(): Date {
    return new Date(this.effectiveDate.getTime());
  }
  getTitleStatus(): TitleStatus {
    return this.titleStatus;
  }
  getFindings(): string | undefined {
    return this.findings;
  }
  getRecommendations(): string | undefined {
    return this.recommendations;
  }

  // Business behavior
  updateStatus(newStatus: TitleStatus): void {
    this.ensureValidStatus(newStatus);
    this.titleStatus = newStatus;
    this.touch();
  }

  updateFindings(updates: {
    findings?: string;
    recommendations?: string;
  }): void {
    if ('findings' in updates) {
      this.findings = updates.findings;
    }
    if ('recommendations' in updates) {
      this.recommendations = updates.recommendations;
    }
    this.touch();
  }

  private ensureValidStatus(status: TitleStatus): void {
    if (!Object.values(TitleStatus).includes(status)) {
      throw new Error('Invalid title status');
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
    this.version++;
  }
}
