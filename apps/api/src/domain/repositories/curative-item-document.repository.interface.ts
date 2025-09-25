export interface CurativeItemDocumentLink {
  id: string;
  curativeItemId: string;
  documentId: string;
  role: string;
  pageRange?: string;
  notes?: string;
  createdAt: Date;
}

export interface CurativeItemDocumentRepository {
  linkDocument(
    link: Omit<CurativeItemDocumentLink, 'id' | 'createdAt'>,
  ): Promise<CurativeItemDocumentLink>;
  listByCurativeItemId(
    curativeItemId: string,
  ): Promise<CurativeItemDocumentLink[]>;
}
