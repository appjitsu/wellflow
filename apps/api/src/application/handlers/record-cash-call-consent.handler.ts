import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RecordCashCallConsentCommand } from '../commands/record-cash-call-consent.command';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';

@Injectable()
@CommandHandler(RecordCashCallConsentCommand)
export class RecordCashCallConsentHandler
  implements ICommandHandler<RecordCashCallConsentCommand, string>
{
  constructor(
    @Inject('CashCallRepository') private readonly repo: ICashCallRepository,
  ) {}

  async execute(command: RecordCashCallConsentCommand): Promise<string> {
    const found = await this.repo.findById(command.id);
    if (!found) throw new NotFoundException('CashCall not found');
    const data = found.toPersistence();
    if (data.organizationId !== command.organizationId)
      throw new BadRequestException('Org mismatch');

    const receivedAtDate = command.receivedAt
      ? new Date(command.receivedAt + 'T00:00:00Z')
      : undefined;
    found.recordConsent(command.status, receivedAtDate);
    const saved = await this.repo.save(found);
    return saved.getId();
  }
}
