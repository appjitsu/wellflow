import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTitleOpinionDocumentsQuery } from '../queries/get-title-opinion-documents.query';
import type { TitleOpinionDocumentRepository } from '../../domain/repositories/title-opinion-document.repository.interface';

@QueryHandler(GetTitleOpinionDocumentsQuery)
export class GetTitleOpinionDocumentsHandler
  implements IQueryHandler<GetTitleOpinionDocumentsQuery>
{
  constructor(
    @Inject('TitleOpinionDocumentRepository')
    private readonly repo: TitleOpinionDocumentRepository,
  ) {}

  async execute(q: GetTitleOpinionDocumentsQuery) {
    return await this.repo.listByTitleOpinionId(q.titleOpinionId);
  }
}
