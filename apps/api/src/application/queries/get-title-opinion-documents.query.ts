import { IQuery } from '@nestjs/cqrs';

export class GetTitleOpinionDocumentsQuery implements IQuery {
  constructor(
    public readonly titleOpinionId: string,
    public readonly organizationId: string,
  ) {}
}
