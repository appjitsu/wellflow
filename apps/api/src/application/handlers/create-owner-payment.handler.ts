import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateOwnerPaymentCommand } from '../commands/create-owner-payment.command';
import type { IOwnerPaymentRepository } from '../../domain/repositories/owner-payment.repository.interface';
import { OwnerPayment } from '../../domain/entities/owner-payment.entity';
import { OutboxService } from '../../infrastructure/events/outbox.service';

const TWO_DECIMAL_PATTERN = /^-?\d+\.\d{2}$/;

@CommandHandler(CreateOwnerPaymentCommand)
export class CreateOwnerPaymentHandler
  implements ICommandHandler<CreateOwnerPaymentCommand>
{
  constructor(
    @Inject('OwnerPaymentRepository')
    private readonly repo: IOwnerPaymentRepository,
    private readonly eventBus: EventBus,
    private readonly outbox: OutboxService,
  ) {}

  async execute(command: CreateOwnerPaymentCommand): Promise<string> {
    if (!command.organizationId || !command.partnerId) {
      throw new BadRequestException(
        'organizationId and partnerId are required',
      );
    }
    if (
      !TWO_DECIMAL_PATTERN.test(command.grossAmount) ||
      !TWO_DECIMAL_PATTERN.test(command.netAmount)
    ) {
      throw new BadRequestException(
        'Amounts must be decimal strings with 2 digits',
      );
    }

    const entity = new OwnerPayment({
      id: randomUUID(),
      organizationId: command.organizationId,
      partnerId: command.partnerId,
      revenueDistributionId: command.revenueDistributionId,
      method: command.method,
      status: 'PENDING',
      grossAmount: command.grossAmount,
      deductionsAmount: command.options?.deductionsAmount ?? null,
      taxWithheldAmount: command.options?.taxWithheldAmount ?? null,
      netAmount: command.netAmount,
      checkNumber: command.options?.checkNumber ?? null,
      achTraceNumber: command.options?.achTraceNumber ?? null,
      memo: command.options?.memo ?? null,
      paymentDate: command.options?.paymentDate ?? null,
    });

    const saved = await this.repo.save(entity);

    await this.outbox.record({
      eventType: 'OwnerPaymentCreated',
      aggregateType: 'OwnerPayment',
      aggregateId: saved.getId(),
      organizationId: saved.getOrganizationId(),
      payload: { id: saved.getId(), partnerId: saved.getPartnerId() },
    });

    return saved.getId();
  }
}
