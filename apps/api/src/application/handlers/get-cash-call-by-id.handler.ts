import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCashCallByIdQuery } from '../queries/get-cash-call-by-id.query';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';
import type { CashCallProps } from '../../domain/entities/cash-call.entity';

@Injectable()
@QueryHandler(GetCashCallByIdQuery)
export class GetCashCallByIdHandler
  implements IQueryHandler<GetCashCallByIdQuery, CashCallProps>
{
  constructor(
    @Inject('CashCallRepository') private readonly repo: ICashCallRepository,
  ) {}
  async execute(query: GetCashCallByIdQuery): Promise<CashCallProps> {
    const found = await this.repo.findById(query.id);
    if (!found) throw new NotFoundException('CashCall not found');
    const data = found.toPersistence();
    if (data.organizationId !== query.organizationId)
      throw new NotFoundException();
    return data;
  }
}
