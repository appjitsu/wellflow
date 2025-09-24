import { Money } from './money';
import { ExpenseCategory, ExpenseType } from '../enums/los-status.enum';

/**
 * Expense Line Item Value Object
 * Represents a single expense entry in a Lease Operating Statement
 * Immutable value object with validation and business rules
 */
export class ExpenseLineItem {
  private readonly id: string;
  private readonly description: string;
  private readonly category: ExpenseCategory;
  private readonly type: ExpenseType;
  private readonly amount: Money;
  private readonly vendorName?: string;
  private readonly invoiceNumber?: string;
  private readonly invoiceDate?: Date;
  private readonly notes?: string;

  constructor(
    id: string,
    description: string,
    category: ExpenseCategory,
    type: ExpenseType,
    amount: Money,
    options?: {
      vendorName?: string;
      invoiceNumber?: string;
      invoiceDate?: Date;
      notes?: string;
    },
  ) {
    this.validateId(id);
    this.validateDescription(description);
    this.validateAmount(amount);

    this.id = id;
    this.description = description.trim();
    this.category = category;
    this.type = type;
    this.amount = amount;
    this.vendorName = options?.vendorName?.trim();
    this.invoiceNumber = options?.invoiceNumber?.trim();
    this.invoiceDate = options?.invoiceDate;
    this.notes = options?.notes?.trim();
  }

  getId(): string {
    return this.id;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): ExpenseCategory {
    return this.category;
  }

  getType(): ExpenseType {
    return this.type;
  }

  getAmount(): Money {
    return this.amount;
  }

  getVendorName(): string | undefined {
    return this.vendorName;
  }

  getInvoiceNumber(): string | undefined {
    return this.invoiceNumber;
  }

  getInvoiceDate(): Date | undefined {
    return this.invoiceDate;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  /**
   * Check if this is an operating expense
   */
  isOperatingExpense(): boolean {
    return this.type === ExpenseType.OPERATING;
  }

  /**
   * Check if this is a capital expense
   */
  isCapitalExpense(): boolean {
    return this.type === ExpenseType.CAPITAL;
  }

  /**
   * Check if this line item equals another
   */
  equals(other: ExpenseLineItem): boolean {
    return (
      this.id === other.id &&
      this.description === other.description &&
      this.category === other.category &&
      this.type === other.type &&
      this.amount.equals(other.amount) &&
      this.vendorName === other.vendorName &&
      this.invoiceNumber === other.invoiceNumber &&
      this.invoiceDate?.getTime() === other.invoiceDate?.getTime() &&
      this.notes === other.notes
    );
  }

  /**
   * Create a new line item with updated amount
   */
  withAmount(newAmount: Money): ExpenseLineItem {
    return new ExpenseLineItem(
      this.id,
      this.description,
      this.category,
      this.type,
      newAmount,
      {
        vendorName: this.vendorName,
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.invoiceDate,
        notes: this.notes,
      },
    );
  }

  /**
   * Create a new line item with updated description
   */
  withDescription(newDescription: string): ExpenseLineItem {
    return new ExpenseLineItem(
      this.id,
      newDescription,
      this.category,
      this.type,
      this.amount,
      {
        vendorName: this.vendorName,
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.invoiceDate,
        notes: this.notes,
      },
    );
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    id: string;
    description: string;
    category: ExpenseCategory;
    type: ExpenseType;
    amount: { amount: number; currency: string };
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
  } {
    return {
      id: this.id,
      description: this.description,
      category: this.category,
      type: this.type,
      amount: this.amount.toJSON(),
      vendorName: this.vendorName,
      invoiceNumber: this.invoiceNumber,
      invoiceDate: this.invoiceDate?.toISOString(),
      notes: this.notes,
    };
  }

  private validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Line item ID must be a non-empty string');
    }
  }

  private validateDescription(description: string): void {
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      throw new Error('Description must be a non-empty string');
    }

    if (description.trim().length > 500) {
      throw new Error('Description must not exceed 500 characters');
    }
  }

  private validateAmount(amount: Money): void {
    if (!amount) {
      throw new Error('Amount is required');
    }

    if (amount.isNegative()) {
      throw new Error('Expense amount cannot be negative');
    }
  }

  /**
   * Factory method to create ExpenseLineItem from JSON
   */
  static fromJSON(data: {
    id: string;
    description: string;
    category: ExpenseCategory;
    type: ExpenseType;
    amount: { amount: number; currency: string };
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
  }): ExpenseLineItem {
    return new ExpenseLineItem(
      data.id,
      data.description,
      data.category,
      data.type,
      new Money(data.amount.amount, data.amount.currency),
      {
        vendorName: data.vendorName,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        notes: data.notes,
      },
    );
  }
}
