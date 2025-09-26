import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCashCallCommand } from '../commands/create-cash-call.command';
import { CashCall } from '../../domain/entities/cash-call.entity';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';
import { OutboxService } from '../../infrastructure/events/outbox.service';

@Injectable()
@CommandHandler(CreateCashCallCommand)
export class CreateCashCallHandler
  implements ICommandHandler<CreateCashCallCommand, string>
{
  constructor(
    @Inject('CashCallRepository') private readonly repo: ICashCallRepository,
    private readonly outbox: OutboxService,
  ) {}

  async execute(command: CreateCashCallCommand): Promise<string> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.billingMonth)) {
      throw new BadRequestException('billingMonth must be YYYY-MM-DD');
    }
    if (!/^-?\d+\.\d{2}$/.test(command.amount)) {
      throw new BadRequestException(
        'amount must be a decimal string with 2 digits',
      );
    }

    const entity = new CashCall({
      organizationId: command.organizationId,
      leaseId: command.leaseId,
      partnerId: command.partnerId,
      billingMonth: command.billingMonth,
      dueDate: command.options?.dueDate ?? null,
      amount: command.amount,
      type: command.type,
      status: 'DRAFT',
      interestRatePercent: command.options?.interestRatePercent ?? null,
      consentRequired: command.options?.consentRequired ?? false,
    });

    const saved = await this.repo.save(entity);

    await this.outbox.record({
      eventType: 'CashCallCreated',
      aggregateType: 'CashCall',
      aggregateId: saved.getId(),
      organizationId: command.organizationId,
      payload: {
        id: saved.getId(),
        partnerId: command.partnerId,
        leaseId: command.leaseId,
        amount: command.amount,
      },
    });

    return saved.getId();
  }
}
