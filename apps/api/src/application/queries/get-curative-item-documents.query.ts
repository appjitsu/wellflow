import { IQuery } from '@nestjs/cqrs';

export class GetCurativeItemDocumentsQuery implements IQuery {
  constructor(
    public readonly curativeItemId: string,
    public readonly organizationId: string,
  ) {}
}
