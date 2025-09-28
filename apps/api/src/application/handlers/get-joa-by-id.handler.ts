import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetJoaByIdQuery } from '../queries/get-joa-by-id.query';
import type { IJoaRepository } from '../../domain/repositories/joa.repository.interface';
import type { JoaProps } from '../../domain/entities/joint-operating-agreement.entity';

@Injectable()
@QueryHandler(GetJoaByIdQuery)
export class GetJoaByIdHandler
  implements IQueryHandler<GetJoaByIdQuery, JoaProps>
{
  constructor(@Inject('JoaRepository') private readonly repo: IJoaRepository) {}
  async execute(query: GetJoaByIdQuery): Promise<JoaProps> {
    const found = await this.repo.findById(query.id);
    if (!found) throw new NotFoundException('JOA not found');
    const data = found.toPersistence();
    if (data.organizationId !== query.organizationId)
      throw new NotFoundException();
    return data;
  }
}
