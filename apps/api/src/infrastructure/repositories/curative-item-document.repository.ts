import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { curativeItemDocuments } from '../../database/schemas/curative-item-documents';
import type {
  CurativeItemDocumentRepository,
  CurativeItemDocumentLink,
} from '../../domain/repositories/curative-item-document.repository.interface';

@Injectable()
export class CurativeItemDocumentRepositoryImpl
  implements CurativeItemDocumentRepository
{
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async linkDocument(
    link: Omit<CurativeItemDocumentLink, 'id' | 'createdAt'>,
  ): Promise<CurativeItemDocumentLink> {
    const values: typeof curativeItemDocuments.$inferInsert = {
      curativeItemId: link.curativeItemId,
      documentId: link.documentId,
      role: link.role,
      pageRange: link.pageRange,
      notes: link.notes,
      createdAt: new Date(),
    };

    const inserted = await this.db
      .insert(curativeItemDocuments)
      .values(values)
      .returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to link document');
    return {
      id: row.id,
      curativeItemId: row.curativeItemId,
      documentId: row.documentId,
      role: row.role,
      pageRange: row.pageRange ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.createdAt),
    };
  }

  async listByCurativeItemId(
    curativeItemId: string,
  ): Promise<CurativeItemDocumentLink[]> {
    const rows = await this.db
      .select()
      .from(curativeItemDocuments)
      .where(eq(curativeItemDocuments.curativeItemId, curativeItemId));

    return rows.map((row) => ({
      id: row.id,
      curativeItemId: row.curativeItemId,
      documentId: row.documentId,
      role: row.role,
      pageRange: row.pageRange ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.createdAt),
    }));
  }
}
