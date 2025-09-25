import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { titleOpinionDocuments } from '../../database/schemas/title-opinion-documents';
import type {
  TitleOpinionDocumentRepository,
  TitleOpinionDocumentLink,
} from '../../domain/repositories/title-opinion-document.repository.interface';

@Injectable()
export class TitleOpinionDocumentRepositoryImpl
  implements TitleOpinionDocumentRepository
{
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async linkDocument(
    link: Omit<TitleOpinionDocumentLink, 'id' | 'createdAt'>,
  ): Promise<TitleOpinionDocumentLink> {
    const values: typeof titleOpinionDocuments.$inferInsert = {
      titleOpinionId: link.titleOpinionId,
      documentId: link.documentId,
      role: link.role,
      pageRange: link.pageRange,
      notes: link.notes,
      createdAt: new Date(),
    };

    const inserted = await this.db
      .insert(titleOpinionDocuments)
      .values(values)
      .returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to link document');
    return {
      id: row.id,
      titleOpinionId: row.titleOpinionId,
      documentId: row.documentId,
      role: row.role,
      pageRange: row.pageRange ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.createdAt),
    };
  }

  async listByTitleOpinionId(
    titleOpinionId: string,
  ): Promise<TitleOpinionDocumentLink[]> {
    const rows = await this.db
      .select()
      .from(titleOpinionDocuments)
      .where(eq(titleOpinionDocuments.titleOpinionId, titleOpinionId));

    return rows.map((row) => ({
      id: row.id,
      titleOpinionId: row.titleOpinionId,
      documentId: row.documentId,
      role: row.role,
      pageRange: row.pageRange ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.createdAt),
    }));
  }
}
