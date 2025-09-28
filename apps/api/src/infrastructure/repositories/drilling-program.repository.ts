import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { drillingPrograms } from '../../database/schemas/drilling-programs';

import { DrillingProgram } from '../../domain/entities/drilling-program.entity';
import { IDrillingProgramRepository } from '../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';
import { DatabaseService } from '../../database/database.service';

// Row types
type Row = typeof drillingPrograms.$inferSelect;

@Injectable()
export class DrillingProgramRepository implements IDrillingProgramRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private mapRowToEntity(row: Row): DrillingProgram {
    // Map specific schema fields into a compact domain shape
    return DrillingProgram.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      wellId: row.wellId,
      afeId: row.afeId ?? null,
      programName: row.programName,
      version: row.version,
      status: row.status as DrillingProgramStatus,
      program: {
        casingProgram: row.casingProgram ?? undefined,
        mudProgram: row.mudProgram ?? undefined,
        bitProgram: row.bitProgram ?? undefined,
        cementProgram: row.cementProgram ?? undefined,
        directionalPlan: row.directionalPlan ?? undefined,
        formationTops: row.formationTops ?? undefined,
      } as unknown as Record<string, unknown>,
      hazards: {
        hazardAnalysis: row.hazardAnalysis ?? undefined,
        riskAssessment: row.riskAssessment ?? undefined,
      } as unknown as Record<string, unknown>,
      estimatedCost: undefined,
      actualCost: undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(program: DrillingProgram): Promise<DrillingProgram> {
    const data = program.toPersistence();
    const existing = await this.findById(data.id);

    if (existing) {
      const db = this.databaseService.getDb();
      await db
        .update(drillingPrograms)
        .set({
          organizationId: data.organizationId,
          wellId: data.wellId,
          afeId: data.afeId ?? null,
          programName: data.programName,
          version: data.version,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(drillingPrograms.id, data.id));
      return program;
    }

    const db = this.databaseService.getDb();
    const insertedRows = await db
      .insert(drillingPrograms)
      .values({
        id: data.id,
        organizationId: data.organizationId,
        wellId: data.wellId,
        afeId: data.afeId ?? null,
        programName: data.programName,
        version: data.version,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      .returning();

    return this.mapRowToEntity(insertedRows[0] as Row);
  }

  async findById(id: string): Promise<DrillingProgram | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(drillingPrograms)
      .where(eq(drillingPrograms.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRowToEntity(row) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      status?: DrillingProgramStatus;
      wellId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<DrillingProgram[]> {
    const filters = {
      organizationId,
      status: options?.status,
      wellId: options?.wellId,
    } as const;

    const conditions = [
      eq(drillingPrograms.organizationId, filters.organizationId),
    ];
    if (filters.status)
      conditions.push(eq(drillingPrograms.status, filters.status));
    if (filters.wellId)
      conditions.push(eq(drillingPrograms.wellId, filters.wellId));

    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(drillingPrograms)
      .where(and(...conditions))
      .orderBy(desc(drillingPrograms.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return (rows as Row[]).map((r) => this.mapRowToEntity(r));
  }

  async findByWellId(wellId: string): Promise<DrillingProgram[]> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(drillingPrograms)
      .where(eq(drillingPrograms.wellId, wellId));
    return rows.map((r) => this.mapRowToEntity(r));
  }
}
