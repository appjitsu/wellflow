import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LinkTitleOpinionDocumentCommand } from '../commands/link-title-opinion-document.command';
import type { TitleOpinionDocumentRepository } from '../../domain/repositories/title-opinion-document.repository.interface';

@CommandHandler(LinkTitleOpinionDocumentCommand)
export class LinkTitleOpinionDocumentHandler
  implements ICommandHandler<LinkTitleOpinionDocumentCommand>
{
  constructor(
    @Inject('TitleOpinionDocumentRepository')
    private readonly repo: TitleOpinionDocumentRepository,
  ) {}

  async execute(cmd: LinkTitleOpinionDocumentCommand): Promise<string> {
    const link = await this.repo.linkDocument({
      titleOpinionId: cmd.titleOpinionId,
      documentId: cmd.documentId,
      role: cmd.role,
      pageRange: cmd.pageRange,
      notes: cmd.notes,
    });
    return link.id;
  }
}
