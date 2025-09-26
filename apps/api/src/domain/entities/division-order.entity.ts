import { IEvent } from '@nestjs/cqrs';
import { DecimalInterest } from '../value-objects/decimal-interest';
import { DivisionOrderCreatedEvent } from '../events/division-order-created.event';
import { DivisionOrderUpdatedEvent } from '../events/division-order-updated.event';
import { DivisionOrderActivatedEvent } from '../events/division-order-activated.event';
import { DivisionOrderDeactivatedEvent } from '../events/division-order-deactivated.event';

export interface DivisionOrderPersistenceData {
  id: string;
  organizationId: string;
  wellId: string;
  partnerId: string;
  decimalInterest: string;
  effectiveDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Division Order Entity - Aggregate Root
 * Represents an interest owner's decimal interest in a well
 *
 * Business Rules:
 * - Decimal interest must be between 0.00000001 and 1.00000000
 * - Only one active division order per partner-well combination
 * - Effective date cannot be in the future
 * - End date must be after effective date
 * - Changes create audit trail through domain events
 */
export class DivisionOrder {
  private id: string;
  private organizationId: string;
  private wellId: string;
  private partnerId: string;
  private decimalInterest: DecimalInterest;
  private effectiveDate: Date;
  private endDate?: Date;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;

  // Domain events
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    organizationId: string,
    wellId: string,
    partnerId: string,
    decimalInterest: DecimalInterest,
    effectiveDate: Date,
    options?: {
      endDate?: Date;
      isActive?: boolean;
    },
  ) {
    this.validateConstructorInputs(
      organizationId,
      wellId,
      partnerId,
      effectiveDate,
      options?.endDate,
    );

    this.id = id;
    this.organizationId = organizationId;
    this.wellId = wellId;
    this.partnerId = partnerId;
    this.decimalInterest = decimalInterest;
    this.effectiveDate = new Date(effectiveDate);
    this.endDate = options?.endDate ? new Date(options.endDate) : undefined;
    this.isActive = options?.isActive ?? true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;

    // Raise domain event for division order creation
    this.addDomainEvent(
      new DivisionOrderCreatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        this.decimalInterest.getValue(),
        this.effectiveDate,
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

  getWellId(): string {
    return this.wellId;
  }

  getPartnerId(): string {
    return this.partnerId;
  }

  getDecimalInterest(): DecimalInterest {
    return this.decimalInterest;
  }

  getEffectiveDate(): Date {
    return new Date(this.effectiveDate);
  }

  getEndDate(): Date | undefined {
    return this.endDate ? new Date(this.endDate) : undefined;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
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
  updateDecimalInterest(
    newDecimalInterest: DecimalInterest,
    updatedBy: string,
  ): void {
    if (this.decimalInterest.equals(newDecimalInterest)) {
      return; // No change needed
    }

    const previousInterest = this.decimalInterest;
    this.decimalInterest = newDecimalInterest;
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new DivisionOrderUpdatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        previousInterest.getValue(),
        newDecimalInterest.getValue(),
        updatedBy,
      ),
    );
  }

  activate(activatedBy: string): void {
    if (this.isActive) {
      return; // Already active
    }

    this.isActive = true;
    this.endDate = undefined;
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new DivisionOrderActivatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        activatedBy,
      ),
    );
  }

  deactivate(endDate: Date, deactivatedBy: string): void {
    if (!this.isActive) {
      return; // Already inactive
    }

    this.validateEndDate(endDate, this.effectiveDate);

    this.isActive = false;
    this.endDate = new Date(endDate);
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new DivisionOrderDeactivatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        endDate,
        deactivatedBy,
      ),
    );
  }

  /**
   * Check if this division order is effective for a given date
   */
  isEffectiveOn(date: Date): boolean {
    if (date < this.effectiveDate) {
      return false;
    }

    if (this.endDate && date > this.endDate) {
      return false;
    }

    return this.isActive;
  }

  /**
   * Check if this division order overlaps with another
   */
  overlapsWith(other: DivisionOrder): boolean {
    if (this.wellId !== other.wellId || this.partnerId !== other.partnerId) {
      return false;
    }

    const thisStart = this.effectiveDate;
    const thisEnd = this.endDate || new Date(2100, 11, 31); // Far future if no end date
    const otherStart = other.effectiveDate;
    const otherEnd = other.endDate || new Date(2100, 11, 31);

    return thisStart <= otherEnd && otherStart <= thisEnd;
  }

  private validateConstructorInputs(
    organizationId: string,
    wellId: string,
    partnerId: string,
    effectiveDate: Date,
    endDate?: Date,
  ): void {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }

    if (!wellId?.trim()) {
      throw new Error('Well ID is required');
    }

    if (!partnerId?.trim()) {
      throw new Error('Partner ID is required');
    }

    if (!effectiveDate) {
      throw new Error('Effective date is required');
    }

    if (effectiveDate > new Date()) {
      throw new Error('Effective date cannot be in the future');
    }

    if (endDate) {
      this.validateEndDate(endDate, effectiveDate);
    }
  }

  private validateEndDate(endDate: Date, effectiveDate: Date): void {
    if (endDate <= effectiveDate) {
      throw new Error('End date must be after effective date');
    }
  }

  // Factory methods
  static create(
    organizationId: string,
    wellId: string,
    partnerId: string,
    decimalInterest: DecimalInterest,
    effectiveDate: Date,
    options?: {
      id?: string;
      endDate?: Date;
      isActive?: boolean;
    },
  ): DivisionOrder {
    const id = options?.id || crypto.randomUUID();
    return new DivisionOrder(
      id,
      organizationId,
      wellId,
      partnerId,
      decimalInterest,
      effectiveDate,
      {
        endDate: options?.endDate,
        isActive: options?.isActive,
      },
    );
  }

  // Factory method for persistence
  static fromPersistence(data: DivisionOrderPersistenceData): DivisionOrder {
    const divisionOrder = new DivisionOrder(
      data.id,
      data.organizationId,
      data.wellId,
      data.partnerId,
      DecimalInterest.fromString(data.decimalInterest),
      data.effectiveDate,
      {
        endDate: data.endDate,
        isActive: data.isActive,
      },
    );

    // Set persistence data
    divisionOrder.createdAt = data.createdAt;
    divisionOrder.updatedAt = data.updatedAt;
    divisionOrder.version = data.version;

    // Clear creation event since this is from persistence
    divisionOrder.clearDomainEvents();

    return divisionOrder;
  }

  // Convert to persistence format
  toPersistence(): DivisionOrderPersistenceData {
    return {
      id: this.id,
      organizationId: this.organizationId,
      wellId: this.wellId,
      partnerId: this.partnerId,
      decimalInterest: this.decimalInterest.toDatabaseDecimal(),
      effectiveDate: this.effectiveDate,
      endDate: this.endDate,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }
}
