import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { titleOpinions } from '../../database/schemas/title-opinions';
import {
  TitleOpinion,
  TitleStatus,
} from '../../domain/entities/title-opinion.entity';
import type { TitleOpinionRepository } from '../../domain/repositories/title-opinion.repository.interface';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class TitleOpinionRepositoryImpl implements TitleOpinionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private toDomain(row: typeof titleOpinions.$inferSelect): TitleOpinion {
    return new TitleOpinion({
      id: row.id,
      organizationId: row.organizationId,
      leaseId: row.leaseId,
      opinionNumber: row.opinionNumber,
      examinerName: row.examinerName,
      examinationDate: new Date(row.examinationDate),
      effectiveDate: new Date(row.effectiveDate),
      titleStatus: row.titleStatus as TitleStatus,
      findings: row.findings ?? undefined,
      recommendations: row.recommendations ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      version: 1,
    });
  }

  async save(opinion: TitleOpinion): Promise<TitleOpinion> {
    // Upsert by id
    const existing = await this.findById(
      opinion.getId(),
      opinion.getOrganizationId(),
    );
    const values: typeof titleOpinions.$inferInsert = {
      id: opinion.getId(),
      organizationId: opinion.getOrganizationId(),
      leaseId: opinion.getLeaseId(),
      opinionNumber: opinion.getOpinionNumber(),
      examinerName: opinion.getExaminerName(),
      examinationDate: opinion
        .getExaminationDate()
        .toISOString()
        .split('T')[0] as string,
      effectiveDate: opinion
        .getEffectiveDate()
        .toISOString()
        .split('T')[0] as string,
      titleStatus: opinion.getTitleStatus(),
      findings: opinion.getFindings(),
      recommendations: opinion.getRecommendations(),
      updatedAt: new Date(),
      createdAt: existing ? undefined : new Date(),
    };

    if (existing) {
      const db = this.databaseService.getDb();
      await db
        .update(titleOpinions)
        .set(values)
        .where(eq(titleOpinions.id, opinion.getId()));
      return opinion;
    }

    const db = this.databaseService.getDb();
    const inserted = await db.insert(titleOpinions).values(values).returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to insert title opinion');
    return this.toDomain(row);
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<TitleOpinion | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(titleOpinions)
      .where(
        and(
          eq(titleOpinions.id, id),
          eq(titleOpinions.organizationId, organizationId),
        ),
      )
      .limit(1);
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByLeaseId(
    leaseId: string,
    options?: { limit?: number; offset?: number; status?: TitleStatus },
  ): Promise<TitleOpinion[]> {
    const where = options?.status
      ? and(
          eq(titleOpinions.leaseId, leaseId),
          eq(titleOpinions.titleStatus, options.status),
        )
      : eq(titleOpinions.leaseId, leaseId);

    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(titleOpinions)
      .where(where)
      .offset(options?.offset ?? 0)
      .limit(options?.limit ?? 50);

    return rows.map((r) => this.toDomain(r));
  }

  async findByOpinionNumber(
    organizationId: string,
    opinionNumber: string,
  ): Promise<TitleOpinion | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(titleOpinions)
      .where(
        and(
          eq(titleOpinions.organizationId, organizationId),
          eq(titleOpinions.opinionNumber, opinionNumber),
        ),
      )
      .limit(1);

    return rows[0] ? this.toDomain(rows[0]) : null;
  }
}
