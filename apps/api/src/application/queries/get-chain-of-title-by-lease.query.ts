import { IQuery } from '@nestjs/cqrs';

export class GetChainOfTitleByLeaseQuery implements IQuery {
  constructor(
    public readonly leaseId: string,
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 100,
  ) {}
}
