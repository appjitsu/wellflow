import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCurativeItemsByTitleOpinionQuery } from '../queries/get-curative-items-by-title-opinion.query';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';
import { CurativeItem } from '../../domain/entities/curative-item.entity';

@QueryHandler(GetCurativeItemsByTitleOpinionQuery)
export class GetCurativeItemsByTitleOpinionHandler
  implements IQueryHandler<GetCurativeItemsByTitleOpinionQuery>
{
  constructor(
    @Inject('CurativeItemRepository')
    private readonly repo: CurativeItemRepository,
  ) {}

  async execute(q: GetCurativeItemsByTitleOpinionQuery): Promise<{
    items: CurativeItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const items = await this.repo.findByTitleOpinionId(
      q.titleOpinionId,
      q.organizationId,
      {
        status: q.status,
        limit: q.limit,
        offset: (q.page - 1) * q.limit,
      },
    );
    // Simple total as items.length; upgrade later with count()
    return { items, total: items.length, page: q.page, limit: q.limit };
  }
}
