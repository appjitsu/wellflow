import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateJoaCommand } from '../commands/create-joa.command';
import { JointOperatingAgreement } from '../../domain/entities/joint-operating-agreement.entity';
import type { IJoaRepository } from '../../domain/repositories/joa.repository.interface';
import { OutboxService } from '../../infrastructure/events/outbox.service';

@Injectable()
@CommandHandler(CreateJoaCommand)
export class CreateJoaHandler
  implements ICommandHandler<CreateJoaCommand, string>
{
  constructor(
    @Inject('JoaRepository') private readonly repo: IJoaRepository,
    private readonly outbox: OutboxService,
  ) {}

  async execute(command: CreateJoaCommand): Promise<string> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(command.effectiveDate)) {
      throw new BadRequestException('effectiveDate must be YYYY-MM-DD');
    }
    if (!command.agreementNumber)
      throw new BadRequestException('agreementNumber required');

    const entity = new JointOperatingAgreement({
      organizationId: command.organizationId,
      agreementNumber: command.agreementNumber,
      effectiveDate: command.effectiveDate,
      endDate: command.options?.endDate ?? null,
      operatorOverheadPercent: command.options?.operatorOverheadPercent ?? null,
      votingThresholdPercent: command.options?.votingThresholdPercent ?? null,
      nonConsentPenaltyPercent:
        command.options?.nonConsentPenaltyPercent ?? null,
      status: 'ACTIVE',
      terms: command.options?.terms ?? null,
    });

    const saved = await this.repo.save(entity);

    await this.outbox.record({
      eventType: 'JoaCreated',
      aggregateType: 'JointOperatingAgreement',
      aggregateId: saved.getId(),
      organizationId: command.organizationId,
      payload: {
        id: saved.getId(),
        agreementNumber: command.agreementNumber,
      },
    });

    return saved.getId();
  }
}
