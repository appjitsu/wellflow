import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCurativeItemDocumentsQuery } from '../queries/get-curative-item-documents.query';
import type { CurativeItemDocumentRepository } from '../../domain/repositories/curative-item-document.repository.interface';

@QueryHandler(GetCurativeItemDocumentsQuery)
export class GetCurativeItemDocumentsHandler
  implements IQueryHandler<GetCurativeItemDocumentsQuery>
{
  constructor(
    @Inject('CurativeItemDocumentRepository')
    private readonly repo: CurativeItemDocumentRepository,
  ) {}

  async execute(q: GetCurativeItemDocumentsQuery) {
    return await this.repo.listByCurativeItemId(q.curativeItemId);
  }
}
