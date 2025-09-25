import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetChainOfTitleByLeaseQuery } from '../queries/get-chain-of-title-by-lease.query';
import type { ChainOfTitleRepository } from '../../domain/repositories/chain-of-title.repository.interface';
import { ChainOfTitleEntry } from '../../domain/entities/chain-of-title-entry.entity';

@QueryHandler(GetChainOfTitleByLeaseQuery)
export class GetChainOfTitleByLeaseHandler
  implements IQueryHandler<GetChainOfTitleByLeaseQuery>
{
  constructor(
    @Inject('ChainOfTitleRepository')
    private readonly repo: ChainOfTitleRepository,
  ) {}

  async execute(q: GetChainOfTitleByLeaseQuery): Promise<{
    entries: ChainOfTitleEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const entries = await this.repo.findByLeaseId(q.leaseId, q.organizationId, {
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
    });
    return { entries, total: entries.length, page: q.page, limit: q.limit };
  }
}
