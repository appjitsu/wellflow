import { AfeApprovalStatus } from '../enums/afe-status.enum';
import { Money } from '../value-objects/money';

interface AfeApprovalPersistenceData {
  id: string;
  afeId: string;
  partnerId: string;
  approvalStatus: AfeApprovalStatus;
  approvedAmount?: string;
  approvalDate?: Date;
  comments?: string;
  approvedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AFE Approval Entity
 * Represents a partner's approval decision for an AFE
 *
 * Business Rules:
 * - Each partner can only have one approval per AFE
 * - Approval status must be valid enum value
 * - Approved amount cannot exceed AFE estimated cost
 * - Rejection requires a reason/comment
 */
export class AfeApproval {
  private id: string;
  private afeId: string;
  private partnerId: string;
  private approvalStatus: AfeApprovalStatus;
  private approvedAmount?: Money;
  private approvalDate?: Date;
  private comments?: string;
  private approvedByUserId?: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    afeId: string,
    partnerId: string,
    approvalStatus: AfeApprovalStatus,
    options?: {
      approvedAmount?: Money;
      approvalDate?: Date;
      comments?: string;
      approvedByUserId?: string;
    },
  ) {
    this.id = id;
    this.afeId = afeId;
    this.partnerId = partnerId;
    this.approvalStatus = approvalStatus;
    this.approvedAmount = options?.approvedAmount;
    this.approvalDate = options?.approvalDate;
    this.comments = options?.comments;
    this.approvedByUserId = options?.approvedByUserId;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.validateApproval();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getAfeId(): string {
    return this.afeId;
  }

  getPartnerId(): string {
    return this.partnerId;
  }

  getApprovalStatus(): AfeApprovalStatus {
    return this.approvalStatus;
  }

  getApprovedAmount(): Money | undefined {
    return this.approvedAmount;
  }

  getApprovalDate(): Date | undefined {
    return this.approvalDate;
  }

  getComments(): string | undefined {
    return this.comments;
  }

  getApprovedByUserId(): string | undefined {
    return this.approvedByUserId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  approve(
    approvedAmount?: Money,
    comments?: string,
    approvedByUserId?: string,
  ): void {
    this.approvalStatus = AfeApprovalStatus.APPROVED;
    this.approvedAmount = approvedAmount;
    this.comments = comments;
    this.approvedByUserId = approvedByUserId;
    this.approvalDate = new Date();
    this.updatedAt = new Date();

    this.validateApproval();
  }

  reject(reason: string, rejectedByUserId?: string): void {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    this.approvalStatus = AfeApprovalStatus.REJECTED;
    this.comments = reason;
    this.approvedByUserId = rejectedByUserId;
    this.approvalDate = new Date();
    this.updatedAt = new Date();

    this.validateApproval();
  }

  conditionalApprove(
    approvedAmount: Money,
    conditions: string,
    approvedByUserId?: string,
  ): void {
    if (!conditions || conditions.trim().length === 0) {
      throw new Error('Conditions are required for conditional approval');
    }

    this.approvalStatus = AfeApprovalStatus.CONDITIONAL;
    this.approvedAmount = approvedAmount;
    this.comments = conditions;
    this.approvedByUserId = approvedByUserId;
    this.approvalDate = new Date();
    this.updatedAt = new Date();

    this.validateApproval();
  }

  updateComments(comments: string): void {
    this.comments = comments;
    this.updatedAt = new Date();
  }

  isPending(): boolean {
    return this.approvalStatus === AfeApprovalStatus.PENDING;
  }

  isApproved(): boolean {
    return this.approvalStatus === AfeApprovalStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.approvalStatus === AfeApprovalStatus.REJECTED;
  }

  isConditional(): boolean {
    return this.approvalStatus === AfeApprovalStatus.CONDITIONAL;
  }

  // Private helper methods
  private validateApproval(): void {
    if (!this.afeId) {
      throw new Error('AFE ID is required');
    }

    if (!this.partnerId) {
      throw new Error('Partner ID is required');
    }

    if (!Object.values(AfeApprovalStatus).includes(this.approvalStatus)) {
      throw new Error('Invalid approval status');
    }

    if (this.approvalStatus === AfeApprovalStatus.REJECTED && !this.comments) {
      throw new Error('Rejection reason is required');
    }

    if (
      this.approvalStatus === AfeApprovalStatus.CONDITIONAL &&
      (!this.comments || !this.approvedAmount)
    ) {
      throw new Error(
        'Conditional approval requires both conditions and approved amount',
      );
    }

    if (this.approvedAmount && this.approvedAmount.getAmount() < 0) {
      throw new Error('Approved amount cannot be negative');
    }
  }

  // Factory method for persistence
  static fromPersistence(data: AfeApprovalPersistenceData): AfeApproval {
    const approval = new AfeApproval(
      data.id,
      data.afeId,
      data.partnerId,
      data.approvalStatus,
      {
        approvedAmount: data.approvedAmount
          ? Money.fromString(data.approvedAmount)
          : undefined,
        approvalDate: data.approvalDate,
        comments: data.comments,
        approvedByUserId: data.approvedByUserId,
      },
    );

    // Set persistence fields
    approval.createdAt = data.createdAt;
    approval.updatedAt = data.updatedAt;

    return approval;
  }

  // Convert to persistence format
  toPersistence(): AfeApprovalPersistenceData {
    return {
      id: this.id,
      afeId: this.afeId,
      partnerId: this.partnerId,
      approvalStatus: this.approvalStatus,
      approvedAmount: this.approvedAmount?.toString(),
      approvalDate: this.approvalDate,
      comments: this.comments,
      approvedByUserId: this.approvedByUserId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
