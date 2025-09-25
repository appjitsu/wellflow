import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { AddChainOfTitleEntryCommand } from '../commands/add-chain-of-title-entry.command';
import type { ChainOfTitleRepository } from '../../domain/repositories/chain-of-title.repository.interface';
import { ChainOfTitleEntry } from '../../domain/entities/chain-of-title-entry.entity';
import { randomUUID } from 'crypto';

@CommandHandler(AddChainOfTitleEntryCommand)
export class AddChainOfTitleEntryHandler
  implements ICommandHandler<AddChainOfTitleEntryCommand>
{
  constructor(
    @Inject('ChainOfTitleRepository')
    private readonly repo: ChainOfTitleRepository,
  ) {}

  async execute(cmd: AddChainOfTitleEntryCommand): Promise<string> {
    const entity = new ChainOfTitleEntry({
      id: randomUUID(),
      organizationId: cmd.organizationId,
      leaseId: cmd.leaseId,
      instrumentType: cmd.instrumentType,
      instrumentDate: cmd.instrumentDate,
      grantor: cmd.grantor,
      grantee: cmd.grantee,
      legalDescriptionRef: cmd.legalDescriptionRef,
      recordingInfo: cmd.recordingInfo,
      notes: cmd.notes,
    });

    const saved = await this.repo.addEntry(entity);
    return saved.getId();
  }
}
