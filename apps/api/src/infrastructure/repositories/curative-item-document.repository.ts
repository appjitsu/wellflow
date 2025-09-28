import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { curativeItemDocuments } from '../../database/schemas/curative-item-documents';
import type {
  CurativeItemDocumentRepository,
  CurativeItemDocumentLink,
} from '../../domain/repositories/curative-item-document.repository.interface';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CurativeItemDocumentRepositoryImpl
  implements CurativeItemDocumentRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

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

    const db = this.databaseService.getDb();
    const inserted = await db
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
    const db = this.databaseService.getDb();
    const rows = await db
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
