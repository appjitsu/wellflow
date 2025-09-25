import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetTitleOpinionByIdQuery } from '../queries/get-title-opinion-by-id.query';
import type { TitleOpinionRepository } from '../../domain/repositories/title-opinion.repository.interface';
import { TitleOpinion } from '../../domain/entities/title-opinion.entity';

export class TitleOpinionView {
  constructor(public readonly data: TitleOpinion) {}
}

@QueryHandler(GetTitleOpinionByIdQuery)
export class GetTitleOpinionByIdHandler
  implements IQueryHandler<GetTitleOpinionByIdQuery>
{
  constructor(
    @Inject('TitleOpinionRepository')
    private readonly repo: TitleOpinionRepository,
  ) {}

  async execute(q: GetTitleOpinionByIdQuery): Promise<TitleOpinion> {
    const entity = await this.repo.findById(q.id, q.organizationId);
    if (!entity) throw new NotFoundException('Title opinion not found');
    return entity;
  }
}
