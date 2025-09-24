import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LosStatus,
  ExpenseCategory,
  ExpenseType,
} from '../../domain/enums/los-status.enum';
import { LeaseOperatingStatement } from '../../domain/entities/lease-operating-statement.entity';
import { ExpenseLineItem } from '../../domain/value-objects/expense-line-item';

/**
 * Lease Operating Statement DTO
 * Data Transfer Object for LOS responses
 */
export class LosDto {
  id!: string;
  organizationId!: string;
  leaseId!: string;
  leaseName?: string;
  statementMonth!: string;
  displayMonth!: string;
  totalExpenses!: number;
  operatingExpenses!: number;
  capitalExpenses!: number;
  status!: LosStatus;
  notes?: string;
  expenseLineItems!: ExpenseLineItemDto[];
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;

  constructor(data: Partial<LosDto>) {
    Object.assign(this, data);
  }

  static fromDomain(los: LeaseOperatingStatement, leaseName?: string): LosDto {
    return new LosDto({
      id: los.getId(),
      organizationId: los.getOrganizationId(),
      leaseId: los.getLeaseId(),
      leaseName,
      statementMonth: los.getStatementMonth().toString(),
      displayMonth: los.getStatementMonth().toDisplayString(),
      totalExpenses: los.getTotalExpenses(),
      operatingExpenses: los.getOperatingExpenses(),
      capitalExpenses: los.getCapitalExpenses(),
      status: los.getStatus(),
      notes: los.getNotes(),
      expenseLineItems: los
        .getExpenseLineItems()
        .map((item) => ExpenseLineItemDto.fromDomain(item)),
      createdAt: los.getCreatedAt(),
      updatedAt: los.getUpdatedAt(),
      version: los.getVersion(),
    });
  }
}

/**
 * Expense Line Item DTO
 * Data Transfer Object for expense line items
 */
export class ExpenseLineItemDto {
  id!: string;
  description!: string;
  category!: ExpenseCategory;
  type!: ExpenseType;
  amount!: number;
  currency!: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  notes?: string;

  constructor(data: Partial<ExpenseLineItemDto>) {
    Object.assign(this, data);
  }

  static fromDomain(item: ExpenseLineItem): ExpenseLineItemDto {
    return new ExpenseLineItemDto({
      id: item.getId(),
      description: item.getDescription(),
      category: item.getCategory(),
      type: item.getType(),
      amount: item.getAmount().getAmount(),
      currency: item.getAmount().getCurrency(),
      vendorName: item.getVendorName(),
      invoiceNumber: item.getInvoiceNumber(),
      invoiceDate: item.getInvoiceDate(),
      notes: item.getNotes(),
    });
  }
}

/**
 * LOS List Item DTO
 * Simplified DTO for list views
 */
export class LosListItemDto {
  id!: string;
  leaseId!: string;
  leaseName?: string;
  statementMonth!: string;
  displayMonth!: string;
  totalExpenses!: number;
  operatingExpenses!: number;
  capitalExpenses!: number;
  status!: LosStatus;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<LosListItemDto>) {
    Object.assign(this, data);
  }

  static fromDomain(
    los: LeaseOperatingStatement,
    leaseName?: string,
  ): LosListItemDto {
    return new LosListItemDto({
      id: los.getId(),
      leaseId: los.getLeaseId(),
      leaseName,
      statementMonth: los.getStatementMonth().toString(),
      displayMonth: los.getStatementMonth().toDisplayString(),
      totalExpenses: los.getTotalExpenses(),
      operatingExpenses: los.getOperatingExpenses(),
      capitalExpenses: los.getCapitalExpenses(),
      status: los.getStatus(),
      createdAt: los.getCreatedAt(),
      updatedAt: los.getUpdatedAt(),
    });
  }
}

/**
 * LOS Expense Summary DTO
 * Summary of expenses across leases
 */
export class LosExpenseSummaryDto {
  leaseId!: string;
  leaseName?: string;
  totalOperatingExpenses!: number;
  totalCapitalExpenses!: number;
  totalExpenses!: number;
  statementCount!: number;

  constructor(data: Partial<LosExpenseSummaryDto>) {
    Object.assign(this, data);
  }
}

/**
 * Create LOS DTO
 * Input DTO for creating new LOS
 */
export class CreateLosDto {
  @ApiProperty({
    description: 'Lease ID for the operating statement',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  leaseId!: string;

  @ApiProperty({
    description: 'Year for the statement month',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({
    description: 'Month for the statement (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiPropertyOptional({
    description: 'Optional notes for the statement',
    example: 'March 2024 operating expenses',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Add Expense DTO
 * Input DTO for adding expense line items
 */
export class AddExpenseDto {
  @ApiProperty({
    description: 'Description of the expense',
    example: 'Monthly electricity bill',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.UTILITIES,
  })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiProperty({
    description: 'Expense type (operating or capital)',
    enum: ExpenseType,
    example: ExpenseType.OPERATING,
  })
  @IsEnum(ExpenseType)
  type!: ExpenseType;

  @ApiProperty({
    description: 'Expense amount',
    example: 1250.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Currency code (defaults to USD)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Vendor name',
    example: 'ABC Electric Company',
  })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2024-0123',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Invoice date (ISO string)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  invoiceDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Emergency repair work',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
