import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateTitleOpinionStatusCommand } from '../commands/update-title-opinion-status.command';
import type { TitleOpinionRepository } from '../../domain/repositories/title-opinion.repository.interface';

@CommandHandler(UpdateTitleOpinionStatusCommand)
export class UpdateTitleOpinionStatusHandler
  implements ICommandHandler<UpdateTitleOpinionStatusCommand>
{
  constructor(
    @Inject('TitleOpinionRepository')
    private readonly repo: TitleOpinionRepository,
  ) {}

  async execute(cmd: UpdateTitleOpinionStatusCommand): Promise<void> {
    const opinion = await this.repo.findById(cmd.id, cmd.organizationId);
    if (!opinion) {
      throw new NotFoundException('Title opinion not found');
    }

    opinion.updateStatus(cmd.status);
    await this.repo.save(opinion);
  }
}
