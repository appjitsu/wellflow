export interface TitleOpinionDocumentLink {
  id: string;
  titleOpinionId: string;
  documentId: string;
  role: string;
  pageRange?: string;
  notes?: string;
  createdAt: Date;
}

export interface TitleOpinionDocumentRepository {
  linkDocument(
    link: Omit<TitleOpinionDocumentLink, 'id' | 'createdAt'>,
  ): Promise<TitleOpinionDocumentLink>;
  listByTitleOpinionId(
    titleOpinionId: string,
  ): Promise<TitleOpinionDocumentLink[]>;
}
