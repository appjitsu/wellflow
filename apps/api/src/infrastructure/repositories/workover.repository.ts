import { Injectable, Inject } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { workovers } from '../../database/schemas/workovers';

import { Workover } from '../../domain/entities/workover.entity';
import { IWorkoverRepository } from '../../domain/repositories/workover.repository.interface';
import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

type Row = typeof workovers.$inferSelect;

@Injectable()
export class WorkoverRepository implements IWorkoverRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private mapRowToEntity(row: Row): Workover {
    return Workover.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      wellId: row.wellId,
      afeId: row.afeId ?? null,
      reason: row.reason ?? null,
      status: row.status as WorkoverStatus,
      startDate: row.startDate
        ? new Date(row.startDate as unknown as string)
        : null,
      endDate: row.endDate ? new Date(row.endDate as unknown as string) : null,
      estimatedCost: row.estimatedCost ?? null,
      actualCost: row.actualCost ?? null,
      preProductionSnapshot:
        (row.preProduction as Record<string, unknown>) ?? null,
      postProductionSnapshot:
        (row.postProduction as Record<string, unknown>) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(entity: Workover): Promise<Workover> {
    const data = entity.toPersistence();
    const existing = await this.findById(data.id);

    if (existing) {
      await this.db
        .update(workovers)
        .set({
          organizationId: data.organizationId,
          wellId: data.wellId,
          afeId: data.afeId ?? null,
          reason: data.reason ?? null,
          status: data.status,
          startDate: data.startDate
            ? data.startDate.toISOString().slice(0, 10)
            : null,
          endDate: data.endDate
            ? data.endDate.toISOString().slice(0, 10)
            : null,
          estimatedCost: data.estimatedCost ?? null,
          actualCost: data.actualCost ?? null,
          preProduction: (data.preProductionSnapshot ?? null) as unknown as
            | object
            | null,
          postProduction: (data.postProductionSnapshot ?? null) as unknown as
            | object
            | null,
          updatedAt: new Date(),
        })
        .where(eq(workovers.id, data.id));
      return entity;
    }

    const insertedRows = await this.db
      .insert(workovers)
      .values({
        id: data.id,
        organizationId: data.organizationId,
        wellId: data.wellId,
        afeId: data.afeId ?? null,
        reason: data.reason ?? null,
        status: data.status,
        startDate: data.startDate
          ? data.startDate.toISOString().slice(0, 10)
          : null,
        endDate: data.endDate ? data.endDate.toISOString().slice(0, 10) : null,
        estimatedCost: data.estimatedCost ?? null,
        actualCost: data.actualCost ?? null,
        preProduction: (data.preProductionSnapshot ?? null) as unknown as
          | object
          | null,
        postProduction: (data.postProductionSnapshot ?? null) as unknown as
          | object
          | null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();

    return this.mapRowToEntity(insertedRows[0] as Row);
  }

  async findById(id: string): Promise<Workover | null> {
    const rows = await this.db
      .select()
      .from(workovers)
      .where(eq(workovers.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRowToEntity(row) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      status?: WorkoverStatus;
      wellId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Workover[]> {
    const filters = {
      organizationId,
      status: options?.status,
      wellId: options?.wellId,
    } as const;

    const conditions = [eq(workovers.organizationId, filters.organizationId)];
    if (filters.status) conditions.push(eq(workovers.status, filters.status));
    if (filters.wellId) conditions.push(eq(workovers.wellId, filters.wellId));

    const rows = await this.db
      .select()
      .from(workovers)
      .where(and(...conditions))
      .orderBy(desc(workovers.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return (rows as Row[]).map((r) => this.mapRowToEntity(r));
  }

  async findByWellId(wellId: string): Promise<Workover[]> {
    const rows = await this.db
      .select()
      .from(workovers)
      .where(eq(workovers.wellId, wellId));
    return rows.map((r) => this.mapRowToEntity(r));
  }
}
