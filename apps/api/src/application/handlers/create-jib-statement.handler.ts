import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CreateJibStatementCommand,
  type CreateJibOptional,
} from '../commands/create-jib-statement.command';
import type { IJibStatementRepository } from '../../domain/repositories/jib-statement.repository.interface';
import {
  JibStatement,
  type JibLineItem,
} from '../../domain/entities/jib-statement.entity';
import type { LeaseRepository } from '../../domain/repositories/lease.repository.interface';
import type { PartnersRepository } from '../../partners/domain/partners.repository';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function ensureIsoDate(value: string, field: string): void {
  if (!ISO_DATE_REGEX.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
}

function ensureOptionalIsoDate(
  value: string | null | undefined,
  field: string,
): void {
  if (value && !ISO_DATE_REGEX.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
}

function toStartOfDayUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function assertDateOrder(start: string, end: string): void {
  const startDate = toStartOfDayUtc(start);
  const endDate = toStartOfDayUtc(end);
  if (endDate.getTime() < startDate.getTime()) {
    throw new Error(
      'statementPeriodEnd must be on or after statementPeriodStart',
    );
  }
}

function parseDecimal(value?: string): number {
  if (value == null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function ensureNonNegative(value: string | undefined, field: string): void {
  if (value == null) {
    return;
  }
  const parsed = parseDecimal(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${field} must be non-negative`);
  }
}

function ensurePercentRange(value: string | undefined, field: string): void {
  if (value == null) {
    return;
  }
  const parsed = parseDecimal(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
}

function isJibLineItemArray(
  value: CreateJibOptional['lineItems'],
): value is JibLineItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item != null &&
        (item.type === 'revenue' || item.type === 'expense') &&
        typeof item.description === 'string',
    )
  );
}

function applyLineItemDerivedTotals(optional: CreateJibOptional): void {
  if (
    !isJibLineItemArray(optional.lineItems) ||
    optional.lineItems.length === 0
  ) {
    return;
  }
  const totals = JibStatement.computeTotals(optional.lineItems);
  optional.grossRevenue ??= totals.grossRevenue;
  optional.netRevenue ??= totals.netRevenue;
}

function validateFinancialFields(optional: CreateJibOptional): void {
  ensureNonNegative(optional.grossRevenue, 'grossRevenue');
  ensureNonNegative(optional.netRevenue, 'netRevenue');
  ensureNonNegative(optional.previousBalance, 'previousBalance');
  ensureNonNegative(optional.currentBalance, 'currentBalance');
  ensurePercentRange(optional.workingInterestShare, 'workingInterestShare');
  ensurePercentRange(optional.royaltyShare, 'royaltyShare');
}

function resolveStatusDates(optional: CreateJibOptional): {
  sentAt?: Date;
  paidAt?: Date;
} {
  let sentAt: Date | undefined;
  let paidAt: Date | undefined;

  if (optional.status === 'sent') {
    sentAt = optional.sentAt ? new Date(optional.sentAt) : new Date();
  } else if (optional.sentAt) {
    sentAt = new Date(optional.sentAt);
  }

  if (optional.status === 'paid') {
    const balance = parseDecimal(optional.currentBalance);
    if (optional.currentBalance && (Number.isNaN(balance) || balance > 0)) {
      throw new Error('Cannot set status=paid when currentBalance > 0');
    }
    paidAt = optional.paidAt ? new Date(optional.paidAt) : new Date();
  } else if (optional.paidAt) {
    paidAt = new Date(optional.paidAt);
  }

  return { sentAt, paidAt };
}

@Injectable()
@CommandHandler(CreateJibStatementCommand)
export class CreateJibStatementHandler
  implements ICommandHandler<CreateJibStatementCommand, string>
{
  constructor(
    @Inject('JibStatementRepository')
    private readonly repo: IJibStatementRepository,
    @Inject('LeaseRepository')
    private readonly leases: LeaseRepository,
    @Inject('PartnersRepository')
    private readonly partners: PartnersRepository,
  ) {}

  async execute(command: CreateJibStatementCommand): Promise<string> {
    ensureIsoDate(command.statementPeriodStart, 'statement period start');
    ensureIsoDate(command.statementPeriodEnd, 'statement period end');
    ensureOptionalIsoDate(command.dueDate ?? null, 'due date');
    assertDateOrder(command.statementPeriodStart, command.statementPeriodEnd);

    await this.ensureLeaseAndPartner(command);

    const optional: CreateJibOptional = { ...(command.optional ?? {}) };

    applyLineItemDerivedTotals(optional);
    validateFinancialFields(optional);
    const { sentAt, paidAt } = resolveStatusDates(optional);

    const created = await this.repo.create({
      organizationId: command.organizationId,
      leaseId: command.leaseId,
      partnerId: command.partnerId,
      statementPeriodStart: command.statementPeriodStart,
      statementPeriodEnd: command.statementPeriodEnd,
      dueDate: command.dueDate ?? null,
      grossRevenue: optional.grossRevenue,
      netRevenue: optional.netRevenue,
      workingInterestShare: optional.workingInterestShare,
      royaltyShare: optional.royaltyShare,
      previousBalance: optional.previousBalance,
      currentBalance: optional.currentBalance,
      lineItems: optional.lineItems ?? null,
      status: optional.status,
      sentAt,
      paidAt,
    });
    return created.getId();
  }

  private async ensureLeaseAndPartner(
    command: CreateJibStatementCommand,
  ): Promise<void> {
    const lease = await this.leases.findById(command.leaseId);
    if (!lease || lease.organizationId !== command.organizationId) {
      throw new Error('Lease not found or does not belong to organization');
    }

    const partner = await this.partners.findById(
      command.partnerId,
      command.organizationId,
    );

    if (!partner) {
      throw new Error('Partner not found in organization');
    }
  }
}
