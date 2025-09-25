import { IQuery } from '@nestjs/cqrs';

export class GetTitleOpinionByIdQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
