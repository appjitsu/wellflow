import { IEvent } from '@nestjs/cqrs';
import { Money } from '../value-objects/money';
import { StatementMonth } from '../value-objects/statement-month';
import { ExpenseLineItem } from '../value-objects/expense-line-item';
import { LosStatus, ExpenseType } from '../enums/los-status.enum';
import { LosCreatedEvent } from '../events/los-created.event';
import { LosFinalizedEvent } from '../events/los-finalized.event';
import { LosDistributedEvent } from '../events/los-distributed.event';
import { LosExpenseAddedEvent } from '../events/los-expense-added.event';

interface LosPersistenceData {
  id: string;
  organizationId: string;
  leaseId: string;
  statementMonth: string;
  totalExpenses?: string;
  operatingExpenses?: string;
  capitalExpenses?: string;
  status: LosStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  expenseBreakdown?: any; // JSON data
}

/**
 * Lease Operating Statement Entity - Aggregate Root
 * Represents a monthly operating expense statement for a lease
 *
 * Business Rules:
 * - Must have unique statement month per lease
 * - Status transitions must follow valid workflow
 * - Expenses must be positive amounts
 * - Cannot modify finalized statements
 * - Operating and capital expenses are tracked separately
 * - Total expenses must equal sum of line items
 */
export class LeaseOperatingStatement {
  private id: string;
  private organizationId: string;
  private leaseId: string;
  private statementMonth: StatementMonth;
  private status: LosStatus;
  private notes?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;
  private finalizedAt?: Date;
  private finalizedBy?: string;
  private distributedAt?: Date;
  private distributedBy?: string;

  // Expense tracking
  private expenseLineItems: Map<string, ExpenseLineItem> = new Map();

  // Domain events
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    organizationId: string,
    leaseId: string,
    statementMonth: StatementMonth,
    options?: {
      notes?: string;
      status?: LosStatus;
    },
  ) {
    this.id = id;
    this.organizationId = organizationId;
    this.leaseId = leaseId;
    this.statementMonth = statementMonth;
    this.notes = options?.notes;
    this.status = options?.status || LosStatus.DRAFT;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;

    // Raise domain event for LOS creation
    this.addDomainEvent(
      new LosCreatedEvent(
        this.id,
        this.organizationId,
        this.leaseId,
        this.statementMonth.toString(),
        this.getTotalExpenses(),
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

  getLeaseId(): string {
    return this.leaseId;
  }

  getStatementMonth(): StatementMonth {
    return this.statementMonth;
  }

  getStatus(): LosStatus {
    return this.status;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  getFinalizedAt(): Date | undefined {
    return this.finalizedAt;
  }

  getFinalizedBy(): string | undefined {
    return this.finalizedBy;
  }

  getDistributedAt(): Date | undefined {
    return this.distributedAt;
  }

  getDistributedBy(): string | undefined {
    return this.distributedBy;
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

  getExpenseLineItems(): ExpenseLineItem[] {
    return Array.from(this.expenseLineItems.values());
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
  addExpenseLineItem(lineItem: ExpenseLineItem, addedBy: string): void {
    this.ensureNotFinalized();

    if (this.expenseLineItems.has(lineItem.getId())) {
      throw new Error(
        `Expense line item with ID ${lineItem.getId()} already exists`,
      );
    }

    this.expenseLineItems.set(lineItem.getId(), lineItem);
    this.updatedAt = new Date();
    this.version++;

    // Raise domain event
    this.addDomainEvent(
      new LosExpenseAddedEvent(
        this.id,
        this.organizationId,
        this.leaseId,
        this.statementMonth.toString(),
        lineItem.getId(),
        lineItem.getDescription(),
        lineItem.getCategory(),
        lineItem.getType(),
        lineItem.getAmount().getAmount(),
        addedBy,
      ),
    );
  }

  removeExpenseLineItem(lineItemId: string): void {
    this.ensureNotFinalized();

    if (!this.expenseLineItems.has(lineItemId)) {
      throw new Error(`Expense line item with ID ${lineItemId} not found`);
    }

    this.expenseLineItems.delete(lineItemId);
    this.updatedAt = new Date();
    this.version++;
  }

  updateExpenseLineItem(lineItem: ExpenseLineItem): void {
    this.ensureNotFinalized();

    if (!this.expenseLineItems.has(lineItem.getId())) {
      throw new Error(
        `Expense line item with ID ${lineItem.getId()} not found`,
      );
    }

    this.expenseLineItems.set(lineItem.getId(), lineItem);
    this.updatedAt = new Date();
    this.version++;
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
    this.version++;
  }

  finalize(finalizedBy: string): void {
    if (this.status !== LosStatus.DRAFT) {
      throw new Error('LOS is already finalized');
    }

    if (this.expenseLineItems.size === 0) {
      throw new Error('Cannot finalize LOS without expenses');
    }

    this.status = LosStatus.FINALIZED;
    this.finalizedAt = new Date();
    this.finalizedBy = finalizedBy;
    this.updatedAt = new Date();
    this.version++;

    // Raise domain event
    this.addDomainEvent(
      new LosFinalizedEvent(
        this.id,
        this.organizationId,
        this.leaseId,
        this.statementMonth.toString(),
        this.getTotalExpenses(),
        this.getOperatingExpenses(),
        this.getCapitalExpenses(),
        finalizedBy,
      ),
    );
  }

  distribute(
    distributedBy: string,
    distributionMethod: string,
    recipientCount: number,
  ): void {
    if (this.status !== LosStatus.FINALIZED) {
      throw new Error('Can only distribute finalized LOS');
    }

    this.status = LosStatus.DISTRIBUTED;
    this.distributedAt = new Date();
    this.distributedBy = distributedBy;
    this.updatedAt = new Date();
    this.version++;

    // Raise domain event
    this.addDomainEvent(
      new LosDistributedEvent(
        this.id,
        this.organizationId,
        this.leaseId,
        this.statementMonth.toString(),
        this.getTotalExpenses(),
        distributedBy,
        distributionMethod,
        recipientCount,
      ),
    );
  }

  archive(): void {
    if (this.status !== LosStatus.DISTRIBUTED) {
      throw new Error('Only distributed statements can be archived');
    }

    this.status = LosStatus.ARCHIVED;
    this.updatedAt = new Date();
    this.version++;
  }

  // Calculated properties
  getTotalExpenses(): number {
    return this.getExpenseLineItems().reduce(
      (total, item) => total + item.getAmount().getAmount(),
      0,
    );
  }

  getOperatingExpenses(): number {
    return this.getExpenseLineItems()
      .filter((item) => item.getType() === ExpenseType.OPERATING)
      .reduce((total, item) => total + item.getAmount().getAmount(), 0);
  }

  getCapitalExpenses(): number {
    return this.getExpenseLineItems()
      .filter((item) => item.getType() === ExpenseType.CAPITAL)
      .reduce((total, item) => total + item.getAmount().getAmount(), 0);
  }

  // Helper methods
  private ensureNotFinalized(): void {
    if (
      this.status === LosStatus.FINALIZED ||
      this.status === LosStatus.DISTRIBUTED ||
      this.status === LosStatus.ARCHIVED
    ) {
      throw new Error('Cannot add expenses to finalized LOS');
    }
  }

  private isValidStatusTransition(from: LosStatus, to: LosStatus): boolean {
    const validTransitions: Record<LosStatus, LosStatus[]> = {
      [LosStatus.DRAFT]: [LosStatus.FINALIZED],
      [LosStatus.FINALIZED]: [LosStatus.DISTRIBUTED, LosStatus.DRAFT], // Allow back to draft for corrections
      [LosStatus.DISTRIBUTED]: [LosStatus.ARCHIVED],
      [LosStatus.ARCHIVED]: [], // Terminal state
    };

    return validTransitions[from]?.includes(to) || false;
  }

  // Factory method for persistence
  static fromPersistence(data: LosPersistenceData): LeaseOperatingStatement {
    const los = new LeaseOperatingStatement(
      data.id,
      data.organizationId,
      data.leaseId,
      StatementMonth.fromString(data.statementMonth),
      {
        notes: data.notes,
        status: data.status,
      },
    );

    // Set persistence fields
    los.createdAt = data.createdAt;
    los.updatedAt = data.updatedAt;
    los.version = data.version;

    // Restore expense line items from breakdown
    if (data.expenseBreakdown) {
      try {
        const expenseData =
          typeof data.expenseBreakdown === 'string'
            ? JSON.parse(data.expenseBreakdown)
            : data.expenseBreakdown;

        if (Array.isArray(expenseData)) {
          expenseData.forEach((itemData: any) => {
            const lineItem = ExpenseLineItem.fromJSON(itemData);
            los.expenseLineItems.set(lineItem.getId(), lineItem);
          });
        }
      } catch (error) {
        // Ignore parsing errors for now
        console.warn('Failed to parse expense breakdown:', error);
      }
    }

    // Clear creation event since this is from persistence
    los.clearDomainEvents();

    return los;
  }

  // Convert to persistence format
  toPersistence(): LosPersistenceData {
    return {
      id: this.id,
      organizationId: this.organizationId,
      leaseId: this.leaseId,
      statementMonth: this.statementMonth.toString(),
      totalExpenses: this.getTotalExpenses().toString(),
      operatingExpenses: this.getOperatingExpenses().toString(),
      capitalExpenses: this.getCapitalExpenses().toString(),
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      expenseBreakdown: this.getExpenseLineItems().map((item) => item.toJSON()),
    };
  }
}
