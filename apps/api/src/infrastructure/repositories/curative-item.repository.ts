import { Injectable, Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { curativeItems } from '../../database/schemas/curative-items';
import { titleOpinions } from '../../database/schemas/title-opinions';
import {
  CurativeItem,
  CurativeStatus,
  type CurativePriority,
} from '../../domain/entities/curative-item.entity';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';

@Injectable()
export class CurativeItemRepositoryImpl implements CurativeItemRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private toDomain(row: typeof curativeItems.$inferSelect): CurativeItem {
    return new CurativeItem({
      id: row.id,
      titleOpinionId: row.titleOpinionId,
      itemNumber: row.itemNumber,
      defectType: row.defectType,
      description: row.description,
      priority: row.priority as CurativePriority,
      status: row.status as CurativeStatus,
      assignedTo: row.assignedTo ?? undefined,
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      resolutionDate: row.resolutionDate
        ? new Date(row.resolutionDate)
        : undefined,
      resolutionNotes: row.resolutionNotes ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      version: 1,
    });
  }

  async save(
    item: CurativeItem,
    organizationId: string,
  ): Promise<CurativeItem> {
    const existing = await this.findById(item.getId(), organizationId);

    const values: typeof curativeItems.$inferInsert = {
      id: item.getId(),
      titleOpinionId: item.getTitleOpinionId(),
      itemNumber: item.getItemNumber(),
      defectType: item.getDefectType(),
      description: item.getDescription(),
      priority: item.getPriority(),
      status: item.getStatus(),
      assignedTo: item.getAssignedTo(),
      dueDate: item.getDueDate()?.toISOString().split('T')[0],
      resolutionDate: item.getResolutionDate()?.toISOString().split('T')[0],
      resolutionNotes: item.getResolutionNotes(),
      updatedAt: new Date(),
      createdAt: existing ? undefined : new Date(),
    };

    if (existing) {
      await this.db
        .update(curativeItems)
        .set(values)
        .where(eq(curativeItems.id, item.getId()));
      return item;
    }

    const inserted = await this.db
      .insert(curativeItems)
      .values(values)
      .returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to insert curative item');
    return this.toDomain(row);
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<CurativeItem | null> {
    const rows = await this.db
      .select()
      .from(curativeItems)
      .innerJoin(
        titleOpinions,
        eq(curativeItems.titleOpinionId, titleOpinions.id),
      )
      .where(
        and(
          eq(curativeItems.id, id),
          eq(titleOpinions.organizationId, organizationId),
        ),
      )
      .limit(1);
    return rows[0] ? this.toDomain(rows[0].curative_items) : null;
  }

  async findByTitleOpinionId(
    titleOpinionId: string,
    organizationId: string,
    options?: { limit?: number; offset?: number; status?: CurativeStatus },
  ): Promise<CurativeItem[]> {
    const where = options?.status
      ? and(
          eq(curativeItems.titleOpinionId, titleOpinionId),
          eq(titleOpinions.organizationId, organizationId),
          eq(curativeItems.status, options.status),
        )
      : and(
          eq(curativeItems.titleOpinionId, titleOpinionId),
          eq(titleOpinions.organizationId, organizationId),
        );

    const rows = await this.db
      .select()
      .from(curativeItems)
      .innerJoin(
        titleOpinions,
        eq(curativeItems.titleOpinionId, titleOpinions.id),
      )
      .where(where)
      .offset(options?.offset ?? 0)
      .limit(options?.limit ?? 50);

    return rows.map((r) => this.toDomain(r.curative_items));
  }
}
