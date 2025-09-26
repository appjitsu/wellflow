import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApproveCashCallCommand } from '../commands/approve-cash-call.command';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';

@Injectable()
@CommandHandler(ApproveCashCallCommand)
export class ApproveCashCallHandler
  implements ICommandHandler<ApproveCashCallCommand, string>
{
  constructor(
    @Inject('CashCallRepository') private readonly repo: ICashCallRepository,
  ) {}

  async execute(command: ApproveCashCallCommand): Promise<string> {
    const found = await this.repo.findById(command.id);
    if (!found) throw new NotFoundException('CashCall not found');
    const data = found.toPersistence();
    if (data.organizationId !== command.organizationId)
      throw new BadRequestException('Org mismatch');

    if (data.consentRequired && data.consentStatus !== 'RECEIVED') {
      throw new BadRequestException('Consent must be RECEIVED before approval');
    }

    found.approve();
    const saved = await this.repo.save(found);
    return saved.getId();
  }
}
