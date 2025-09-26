import { AggregateRoot } from '../shared/aggregate-root';
import { PermitStatus } from '../value-objects/permit-status.vo';
import { PermitType } from '../value-objects/permit-type.vo';
import { PermitCreatedEvent } from '../events/permit-created.event';
import { PermitStatusChangedEvent } from '../events/permit-status-changed.event';
import { PermitExpiredEvent } from '../events/permit-expired.event';

/**
 * Permit Aggregate Root
 * Represents a regulatory permit with its complete lifecycle management
 */
export class Permit extends AggregateRoot {
  private _id: string;
  private _permitNumber: string;
  private _permitType: PermitType;
  private _status: PermitStatus;
  private _organizationId: string;
  private _wellId?: string;
  private _issuingAgency: string;
  private _regulatoryAuthority?: string;

  // Dates
  private _applicationDate?: Date;
  private _submittedDate?: Date;
  private _approvalDate?: Date;
  private _expirationDate?: Date;

  // Conditions and requirements
  private _permitConditions?: Record<string, unknown>;
  private _complianceRequirements?: Record<string, unknown>;

  // Financial aspects
  private _feeAmount?: number;
  private _bondAmount?: number;
  private _bondType?: string;

  // Location and facility
  private _location?: string;
  private _facilityId?: string;

  // Document management
  private _documentIds?: string[];

  // Audit fields
  private _createdByUserId: string;
  private _updatedByUserId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    permitNumber: string,
    permitType: PermitType,
    organizationId: string,
    issuingAgency: string,
    createdByUserId: string,
    status: PermitStatus = PermitStatus.DRAFT,
  ) {
    super();
    this._id = id;
    this._permitNumber = permitNumber;
    this._permitType = permitType;
    this._status = status;
    this._organizationId = organizationId;
    this._issuingAgency = issuingAgency;
    this._createdByUserId = createdByUserId;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Factory method for creating new permits
  public static create(
    permitNumber: string,
    permitType: PermitType,
    organizationId: string,
    issuingAgency: string,
    createdByUserId: string,
  ): Permit {
    const permit = new Permit(
      crypto.randomUUID(), // Generate ID
      permitNumber,
      permitType,
      organizationId,
      issuingAgency,
      createdByUserId,
    );

    // Raise domain event
    permit.addDomainEvent(
      new PermitCreatedEvent(permit.id, permitNumber, permitType.value),
    );

    return permit;
  }

  // Business methods
  public submit(submittedByUserId: string): void {
    if (!this._status.canTransitionTo(PermitStatus.SUBMITTED)) {
      throw new Error(`Cannot submit permit in status: ${this._status.value}`);
    }

    const oldStatus = this._status;
    this._status = PermitStatus.SUBMITTED;
    this._submittedDate = new Date();
    this._updatedByUserId = submittedByUserId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PermitStatusChangedEvent(
        this.id,
        oldStatus.value,
        this._status.value,
      ),
    );
  }

  public approve(approvedByUserId: string, approvalDate?: Date): void {
    if (!this._status.canTransitionTo(PermitStatus.APPROVED)) {
      throw new Error(`Cannot approve permit in status: ${this._status.value}`);
    }

    const oldStatus = this._status;
    this._status = PermitStatus.APPROVED;
    this._approvalDate = approvalDate || new Date();
    this._updatedByUserId = approvedByUserId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PermitStatusChangedEvent(
        this.id,
        oldStatus.value,
        this._status.value,
      ),
    );
  }

  public deny(deniedByUserId: string): void {
    if (!this._status.canTransitionTo(PermitStatus.DENIED)) {
      throw new Error(`Cannot deny permit in status: ${this._status.value}`);
    }

    const oldStatus = this._status;
    this._status = PermitStatus.DENIED;
    this._updatedByUserId = deniedByUserId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PermitStatusChangedEvent(
        this.id,
        oldStatus.value,
        this._status.value,
      ),
    );
  }

  public expire(expiredByUserId?: string): void {
    if (!this._status.canTransitionTo(PermitStatus.EXPIRED)) {
      throw new Error(`Cannot expire permit in status: ${this._status.value}`);
    }

    const oldStatus = this._status;
    this._status = PermitStatus.EXPIRED;
    this._expirationDate = new Date();
    this._updatedByUserId = expiredByUserId;
    this._updatedAt = new Date();

    this.addDomainEvent(new PermitExpiredEvent(this.id, this._permitNumber));
    this.addDomainEvent(
      new PermitStatusChangedEvent(
        this.id,
        oldStatus.value,
        this._status.value,
      ),
    );
  }

  public renew(renewedByUserId: string, newExpirationDate: Date): void {
    if (!this._status.canTransitionTo(PermitStatus.RENEWED)) {
      throw new Error(`Cannot renew permit in status: ${this._status.value}`);
    }

    const oldStatus = this._status;
    this._status = PermitStatus.RENEWED;
    this._expirationDate = newExpirationDate;
    this._updatedByUserId = renewedByUserId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PermitStatusChangedEvent(
        this.id,
        oldStatus.value,
        this._status.value,
      ),
    );
  }

  public updateConditions(
    conditions: Record<string, unknown>,
    updatedByUserId: string,
  ): void {
    this._permitConditions = conditions;
    this._updatedByUserId = updatedByUserId;
    this._updatedAt = new Date();
  }

  public updateComplianceRequirements(
    requirements: Record<string, unknown>,
    updatedByUserId: string,
  ): void {
    this._complianceRequirements = requirements;
    this._updatedByUserId = updatedByUserId;
    this._updatedAt = new Date();
  }

  public markAsExpired(): void {
    if (this._status.value === 'expired') return;

    if (this._expirationDate && new Date() < this._expirationDate) {
      throw new Error('Cannot mark permit as expired before expiration date');
    }

    this._status = PermitStatus.EXPIRED;
    this._updatedAt = new Date();
  }

  public canBeRenewed(): boolean {
    // Can only renew approved permits that haven't expired
    return (
      this._status.value === 'approved' &&
      this._expirationDate != null &&
      new Date() <= this._expirationDate
    );
  }

  public revertExpirationDate(originalExpirationDate: Date): void {
    this._expirationDate = originalExpirationDate;
    this._updatedAt = new Date();
  }

  // Business logic queries
  public isExpired(): boolean {
    if (!this._expirationDate) return false;
    return new Date() > this._expirationDate;
  }

  public isExpiringSoon(days: number = 30): boolean {
    if (!this._expirationDate) return false;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return this._expirationDate <= warningDate;
  }

  public requiresRenewal(): boolean {
    return this._permitType.hasRenewalRequirements() && this.isExpiringSoon(90);
  }

  public isActive(): boolean {
    return this._status.isActive() && !this.isExpired();
  }

  // Entity interface implementation
  public getId(): { getValue(): string } {
    return { getValue: () => this._id };
  }

  // Getters
  public get id(): string {
    return this._id;
  }

  public get permitNumber(): string {
    return this._permitNumber;
  }

  public get permitType(): PermitType {
    return this._permitType;
  }

  public get status(): PermitStatus {
    return this._status;
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get wellId(): string | undefined {
    return this._wellId;
  }

  public get issuingAgency(): string {
    return this._issuingAgency;
  }

  public get regulatoryAuthority(): string | undefined {
    return this._regulatoryAuthority;
  }

  public get applicationDate(): Date | undefined {
    return this._applicationDate;
  }

  public get submittedDate(): Date | undefined {
    return this._submittedDate;
  }

  public get approvalDate(): Date | undefined {
    return this._approvalDate;
  }

  public get expirationDate(): Date | undefined {
    return this._expirationDate;
  }

  public get permitConditions(): Record<string, unknown> | undefined {
    return this._permitConditions;
  }

  public get complianceRequirements(): Record<string, unknown> | undefined {
    return this._complianceRequirements;
  }

  public get feeAmount(): number | undefined {
    return this._feeAmount;
  }

  public get bondAmount(): number | undefined {
    return this._bondAmount;
  }

  public get bondType(): string | undefined {
    return this._bondType;
  }

  public get location(): string | undefined {
    return this._location;
  }

  public get facilityId(): string | undefined {
    return this._facilityId;
  }

  public get documentIds(): string[] | undefined {
    return this._documentIds;
  }

  public get createdByUserId(): string {
    return this._createdByUserId;
  }

  public get updatedByUserId(): string | undefined {
    return this._updatedByUserId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters (used for reconstruction from persistence)
  public set permitNumber(value: string) {
    this._permitNumber = value;
  }

  public set permitType(value: PermitType) {
    this._permitType = value;
  }

  public set status(value: PermitStatus) {
    this._status = value;
  }

  public set wellId(value: string | undefined) {
    this._wellId = value;
  }

  public set regulatoryAuthority(value: string | undefined) {
    this._regulatoryAuthority = value;
  }

  public set applicationDate(value: Date | undefined) {
    this._applicationDate = value;
  }

  public set submittedDate(value: Date | undefined) {
    this._submittedDate = value;
  }

  public set approvalDate(value: Date | undefined) {
    this._approvalDate = value;
  }

  public set expirationDate(value: Date | undefined) {
    this._expirationDate = value;
  }

  public set permitConditions(value: Record<string, unknown> | undefined) {
    this._permitConditions = value;
  }

  public set complianceRequirements(
    value: Record<string, unknown> | undefined,
  ) {
    this._complianceRequirements = value;
  }

  public set feeAmount(value: number | undefined) {
    this._feeAmount = value;
  }

  public set bondAmount(value: number | undefined) {
    this._bondAmount = value;
  }

  public set bondType(value: string | undefined) {
    this._bondType = value;
  }

  public set location(value: string | undefined) {
    this._location = value;
  }

  public set facilityId(value: string | undefined) {
    this._facilityId = value;
  }

  public set documentIds(value: string[] | undefined) {
    this._documentIds = value;
  }

  public set updatedByUserId(value: string | undefined) {
    this._updatedByUserId = value;
  }

  public set createdAt(value: Date) {
    this._createdAt = value;
  }

  public set updatedAt(value: Date) {
    this._updatedAt = value;
  }
}
