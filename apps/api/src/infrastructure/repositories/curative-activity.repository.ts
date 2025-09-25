import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { curativeActivities } from '../../database/schemas/curative-activities';
import {
  CurativeActivity,
  ActionType,
} from '../../domain/entities/curative-activity.entity';
import type { CurativeActivityRepository } from '../../domain/repositories/curative-activity.repository.interface';

@Injectable()
export class CurativeActivityRepositoryImpl
  implements CurativeActivityRepository
{
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private toDomain(
    row: typeof curativeActivities.$inferSelect,
  ): CurativeActivity {
    return new CurativeActivity({
      id: row.id,
      curativeItemId: row.curativeItemId,
      actionType: row.actionType as ActionType,
      actionBy: row.actionBy ?? undefined,
      actionDate: new Date(row.actionDate),
      details: row.details ?? undefined,
      previousStatus: row.previousStatus ?? undefined,
      newStatus: row.newStatus ?? undefined,
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  async save(activity: CurativeActivity): Promise<CurativeActivity> {
    const values: typeof curativeActivities.$inferInsert = {
      id: activity.getId(),
      curativeItemId: activity.getCurativeItemId(),
      actionType: activity.getActionType(),
      actionBy: activity.getActionBy(),
      actionDate: activity.getActionDate(),
      details: activity.getDetails(),
      previousStatus: activity.getPreviousStatus(),
      newStatus: activity.getNewStatus(),
      dueDate: activity.getDueDate()?.toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await this.db
      .insert(curativeActivities)
      .values(values)
      .returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to insert curative activity');
    return this.toDomain(row);
  }

  async findByCurativeItemId(
    curativeItemId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<CurativeActivity[]> {
    const rows = await this.db
      .select()
      .from(curativeActivities)
      .where(eq(curativeActivities.curativeItemId, curativeItemId))
      .offset(options?.offset ?? 0)
      .limit(options?.limit ?? 50)
      .orderBy(curativeActivities.actionDate);

    return rows.map((r) => this.toDomain(r));
  }
}
