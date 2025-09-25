import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateTitleOpinionCommand } from '../commands/create-title-opinion.command';
import type { TitleOpinionRepository } from '../../domain/repositories/title-opinion.repository.interface';
import { TitleOpinion } from '../../domain/entities/title-opinion.entity';
import { randomUUID } from 'crypto';

@CommandHandler(CreateTitleOpinionCommand)
export class CreateTitleOpinionHandler
  implements ICommandHandler<CreateTitleOpinionCommand>
{
  constructor(
    @Inject('TitleOpinionRepository')
    private readonly repo: TitleOpinionRepository,
  ) {}

  async execute(cmd: CreateTitleOpinionCommand): Promise<string> {
    const duplicate = await this.repo.findByOpinionNumber(
      cmd.organizationId,
      cmd.opinionNumber,
    );
    if (duplicate) throw new ConflictException('Opinion number already exists');

    const entity = new TitleOpinion({
      id: randomUUID(),
      organizationId: cmd.organizationId,
      leaseId: cmd.leaseId,
      opinionNumber: cmd.opinionNumber,
      examinerName: cmd.examinerName,
      examinationDate: cmd.examinationDate,
      effectiveDate: cmd.effectiveDate,
      titleStatus: cmd.titleStatus,
      findings: cmd.findings,
      recommendations: cmd.recommendations,
    });

    const saved = await this.repo.save(entity);
    return saved.getId();
  }
}
