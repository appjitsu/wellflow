import { IQuery } from '@nestjs/cqrs';
import { CurativeStatus } from '../../domain/entities/curative-item.entity';

export class GetCurativeItemsByTitleOpinionQuery implements IQuery {
  constructor(
    public readonly titleOpinionId: string,
    public readonly organizationId: string,
    public readonly status?: CurativeStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
