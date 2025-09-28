import { IEvent } from '@nestjs/cqrs';
import { AfeNumber } from '../value-objects/afe-number';
import { Money } from '../value-objects/money';
import { AfeStatus, AfeType } from '../enums/afe-status.enum';
import { AfeCreatedEvent } from '../events/afe-created.event';
import { AfeStatusChangedEvent } from '../events/afe-status-changed.event';
import { AfeSubmittedEvent } from '../events/afe-submitted.event';
import { AfeApprovedEvent } from '../events/afe-approved.event';
import { AfeRejectedEvent } from '../events/afe-rejected.event';

export interface AfeLineItem {
  id: string;
  lineNumber: number;
  description: string;
  category: string;
  estimatedCost: Money;
  actualCost?: Money;
  vendorId?: string;
  notes?: string;
}

export interface AfeApproval {
  id: string;
  partnerId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'conditional';
  approvedAmount?: Money;
  approvalDate?: Date;
  comments?: string;
  approvedByUserId?: string;
}

interface AfePersistenceData {
  id: string;
  organizationId: string;
  afeNumber: string;
  wellId?: string;
  leaseId?: string;
  afeType: AfeType;
  status: AfeStatus;
  totalEstimatedCost?: string;
  approvedAmount?: string;
  actualCost?: string;
  effectiveDate?: Date;
  approvalDate?: Date;
  submittedAt?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * AFE (Authorization for Expenditure) Entity - Aggregate Root
 * Represents an authorization for capital expenditure in oil & gas operations
 *
 * Business Rules:
 * - AFE must have unique number within organization
 * - Status transitions must follow valid workflow
 * - Estimated costs must be positive
 * - Approval workflow required for submitted AFEs
 * - Partner consent required for joint venture operations
 */
export class Afe {
  private id: string;
  private organizationId: string;
  private afeNumber: AfeNumber;
  private wellId?: string;
  private leaseId?: string;
  private afeType: AfeType;
  private status: AfeStatus;
  private totalEstimatedCost?: Money;
  private approvedAmount?: Money;
  private actualCost?: Money;
  private effectiveDate?: Date;
  private approvalDate?: Date;
  private submittedAt?: Date;
  private description?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;

  // Domain events
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    organizationId: string,
    afeNumber: AfeNumber,
    afeType: AfeType,
    options?: {
      wellId?: string;
      leaseId?: string;
      totalEstimatedCost?: Money;
      description?: string;
      status?: AfeStatus;
    },
  ) {
    this.id = id;
    this.organizationId = organizationId;
    this.afeNumber = afeNumber;
    this.afeType = afeType;
    this.wellId = options?.wellId;
    this.leaseId = options?.leaseId;
    this.totalEstimatedCost = options?.totalEstimatedCost;
    this.description = options?.description;
    this.status = options?.status || AfeStatus.DRAFT;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;

    // Raise domain event for AFE creation
    this.addDomainEvent(
      new AfeCreatedEvent(
        this.id,
        this.organizationId,
        this.afeNumber.getValue(),
        this.afeType,
        this.totalEstimatedCost?.getAmount(),
      ),
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getAfeNumber(): AfeNumber {
    return this.afeNumber;
  }

  getWellId(): string | undefined {
    return this.wellId;
  }

  getLeaseId(): string | undefined {
    return this.leaseId;
  }

  getAfeType(): AfeType {
    return this.afeType;
  }

  getStatus(): AfeStatus {
    return this.status;
  }

  getTotalEstimatedCost(): Money | undefined {
    return this.totalEstimatedCost;
  }

  getApprovedAmount(): Money | undefined {
    return this.approvedAmount;
  }

  getActualCost(): Money | undefined {
    return this.actualCost;
  }

  getEffectiveDate(): Date | undefined {
    return this.effectiveDate;
  }

  getApprovalDate(): Date | undefined {
    return this.approvalDate;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): number {
    return this.version;
  }

  // Domain events management
  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }

  addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Business methods
  updateStatus(newStatus: AfeStatus, updatedBy: string): void {
    if (!this.isValidStatusTransition(this.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    const previousStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.version++;

    // Raise appropriate domain event based on status change
    this.addDomainEvent(
      new AfeStatusChangedEvent(
        this.id,
        this.afeNumber.getValue(),
        previousStatus,
        newStatus,
        updatedBy,
      ),
    );

    // Raise specific events for key status changes
    if (newStatus === AfeStatus.SUBMITTED) {
      this.addDomainEvent(
        new AfeSubmittedEvent(
          this.id,
          this.organizationId,
          this.afeNumber.getValue(),
          this.afeType,
          this.totalEstimatedCost?.getAmount(),
          updatedBy,
        ),
      );
    } else if (newStatus === AfeStatus.APPROVED) {
      this.approvalDate = new Date();
      this.addDomainEvent(
        new AfeApprovedEvent(
          this.id,
          this.organizationId,
          this.afeNumber.getValue(),
          this.approvedAmount?.getAmount() ??
            this.totalEstimatedCost?.getAmount(),
          updatedBy,
        ),
      );
    } else if (newStatus === AfeStatus.REJECTED) {
      this.addDomainEvent(
        new AfeRejectedEvent(
          this.id,
          this.organizationId,
          this.afeNumber.getValue(),
          updatedBy,
        ),
      );
    }
  }

  submit(submittedBy: string): void {
    this.validateForSubmission();
    this.submittedAt = new Date();
    this.updateStatus(AfeStatus.SUBMITTED, submittedBy);
  }

  approve(approvedBy: string, approvedAmount?: Money): void {
    if (this.status !== AfeStatus.SUBMITTED) {
      throw new Error('AFE must be in submitted status to approve');
    }

    if (approvedAmount) {
      this.approvedAmount = approvedAmount;
    }

    this.updateStatus(AfeStatus.APPROVED, approvedBy);
  }

  reject(rejectedBy: string): void {
    if (this.status !== AfeStatus.SUBMITTED) {
      throw new Error('AFE must be in submitted status to reject');
    }

    this.updateStatus(AfeStatus.REJECTED, rejectedBy);
  }

  updateEstimatedCost(newCost: Money): void {
    if (this.status !== AfeStatus.DRAFT) {
      throw new Error('Cannot update estimated cost after AFE is submitted');
    }

    this.totalEstimatedCost = newCost;
    this.updatedAt = new Date();
    this.version++;
  }

  updateActualCost(actualCost: Money): void {
    if (
      this.status !== AfeStatus.APPROVED &&
      this.status !== AfeStatus.CLOSED
    ) {
      throw new Error(
        'Can only update actual cost for approved or closed AFEs',
      );
    }

    this.actualCost = actualCost;
    this.updatedAt = new Date();
    this.version++;
  }

  close(): void {
    if (this.status !== AfeStatus.APPROVED) {
      throw new Error('Can only close approved AFEs');
    }

    this.status = AfeStatus.CLOSED;
    this.updatedAt = new Date();
    this.version++;
  }

  // Private helper methods
  private isValidStatusTransition(from: AfeStatus, to: AfeStatus): boolean {
    switch (from) {
      case AfeStatus.DRAFT:
        return [AfeStatus.SUBMITTED].includes(to);
      case AfeStatus.SUBMITTED:
        return [
          AfeStatus.APPROVED,
          AfeStatus.REJECTED,
          AfeStatus.DRAFT,
        ].includes(to);
      case AfeStatus.APPROVED:
        return [AfeStatus.CLOSED].includes(to);
      case AfeStatus.REJECTED:
        return [AfeStatus.DRAFT].includes(to);
      case AfeStatus.CLOSED:
        return false; // Terminal state
      default:
        return false;
    }
  }

  private validateForSubmission(): void {
    if (!this.totalEstimatedCost) {
      throw new Error('Total estimated cost is required for submission');
    }

    if (this.totalEstimatedCost.getAmount() <= 0) {
      throw new Error('Total estimated cost must be greater than zero');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Description is required for submission');
    }
  }

  // Factory method for persistence
  static fromPersistence(data: AfePersistenceData): Afe {
    const afe = new Afe(
      data.id,
      data.organizationId,
      new AfeNumber(data.afeNumber),
      data.afeType,
      {
        wellId: data.wellId,
        leaseId: data.leaseId,
        totalEstimatedCost: data.totalEstimatedCost
          ? Money.fromString(data.totalEstimatedCost)
          : undefined,
        description: data.description,
        status: data.status,
      },
    );

    // Set persistence fields
    afe.approvedAmount = data.approvedAmount
      ? Money.fromString(data.approvedAmount)
      : undefined;
    afe.actualCost = data.actualCost
      ? Money.fromString(data.actualCost)
      : undefined;
    afe.effectiveDate = data.effectiveDate;
    afe.approvalDate = data.approvalDate;
    afe.submittedAt = data.submittedAt;
    afe.createdAt = data.createdAt;
    afe.updatedAt = data.updatedAt;
    afe.version = data.version;

    // Clear creation event since this is from persistence
    afe.clearDomainEvents();

    return afe;
  }

  // Convert to persistence format
  toPersistence(): AfePersistenceData {
    return {
      id: this.id,
      organizationId: this.organizationId,
      afeNumber: this.afeNumber.getValue(),
      wellId: this.wellId,
      leaseId: this.leaseId,
      afeType: this.afeType,
      status: this.status,
      totalEstimatedCost: this.totalEstimatedCost?.toString(),
      approvedAmount: this.approvedAmount?.toString(),
      actualCost: this.actualCost?.toString(),
      effectiveDate: this.effectiveDate,
      approvalDate: this.approvalDate,
      submittedAt: this.submittedAt,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }
}
