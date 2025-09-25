import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateTitleOpinionFindingsCommand } from '../commands/update-title-opinion-findings.command';
import type { TitleOpinionRepository } from '../../domain/repositories/title-opinion.repository.interface';

@CommandHandler(UpdateTitleOpinionFindingsCommand)
export class UpdateTitleOpinionFindingsHandler
  implements ICommandHandler<UpdateTitleOpinionFindingsCommand>
{
  constructor(
    @Inject('TitleOpinionRepository')
    private readonly repo: TitleOpinionRepository,
  ) {}

  async execute(cmd: UpdateTitleOpinionFindingsCommand): Promise<void> {
    const opinion = await this.repo.findById(cmd.id, cmd.organizationId);
    if (!opinion) {
      throw new NotFoundException('Title opinion not found');
    }

    opinion.updateFindings(cmd.findings, cmd.recommendations);
    await this.repo.save(opinion);
  }
}
