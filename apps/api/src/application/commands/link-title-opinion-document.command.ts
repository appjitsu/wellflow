import { ICommand } from '@nestjs/cqrs';

export class LinkTitleOpinionDocumentCommand implements ICommand {
  constructor(
    public readonly titleOpinionId: string,
    public readonly documentId: string,
    public readonly role: string,
    public readonly pageRange?: string,
    public readonly notes?: string,
  ) {}
}
