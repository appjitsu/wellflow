import { Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, desc, eq } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { jointOperatingAgreements } from '../../database/schemas/joint-operating-agreements';
import {
  JointOperatingAgreement,
  JoaStatus,
} from '../../domain/entities/joint-operating-agreement.entity';
import type { IJoaRepository } from '../../domain/repositories/joa.repository.interface';
import { DatabaseService } from '../../database/database.service';

type Row = typeof jointOperatingAgreements.$inferSelect;

@Injectable()
export class JoaRepository implements IJoaRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private mapRow(row: Row): JointOperatingAgreement {
    return JointOperatingAgreement.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      agreementNumber: row.agreementNumber,
      effectiveDate: row.effectiveDate,
      endDate: row.endDate ?? null,
      operatorOverheadPercent: row.operatorOverheadPercent ?? null,
      votingThresholdPercent: row.votingThresholdPercent ?? null,
      nonConsentPenaltyPercent: row.nonConsentPenaltyPercent ?? null,
      status: row.status as JoaStatus,
      terms: (row.terms ?? undefined) as Record<string, unknown> | undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(
    entity: JointOperatingAgreement,
  ): Promise<JointOperatingAgreement> {
    const data = entity.toPersistence();
    const existing = data.id ? await this.findById(data.id) : null;

    if (existing) {
      if (!data.id) {
        throw new Error('JointOperatingAgreement ID is required for updates');
      }
      const db = this.databaseService.getDb();
      await db
        .update(jointOperatingAgreements)
        .set({
          agreementNumber: data.agreementNumber,
          effectiveDate: data.effectiveDate,
          endDate: data.endDate ?? null,
          operatorOverheadPercent: data.operatorOverheadPercent ?? '0.00',
          votingThresholdPercent: data.votingThresholdPercent ?? '50.00',
          nonConsentPenaltyPercent: data.nonConsentPenaltyPercent ?? '0.00',
          status: data.status,
          terms: data.terms ?? null,
          updatedAt: new Date(),
        })
        .where(eq(jointOperatingAgreements.id, data.id));
      return entity;
    }

    const db = this.databaseService.getDb();
    const rows = await db
      .insert(jointOperatingAgreements)
      .values({
        organizationId: data.organizationId,
        agreementNumber: data.agreementNumber,
        effectiveDate: data.effectiveDate,
        endDate: data.endDate ?? null,
        operatorOverheadPercent: data.operatorOverheadPercent ?? '0.00',
        votingThresholdPercent: data.votingThresholdPercent ?? '50.00',
        nonConsentPenaltyPercent: data.nonConsentPenaltyPercent ?? '0.00',
        status: data.status,
        terms: data.terms ?? null,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      })
      .returning();
    return this.mapRow(rows[0] as Row);
  }

  async findById(id: string): Promise<JointOperatingAgreement | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(jointOperatingAgreements)
      .where(eq(jointOperatingAgreements.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: { status?: Row['status']; limit?: number; offset?: number },
  ): Promise<JointOperatingAgreement[]> {
    const conditions = [
      eq(jointOperatingAgreements.organizationId, organizationId),
    ];
    if (options?.status)
      conditions.push(eq(jointOperatingAgreements.status, options.status));

    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(jointOperatingAgreements)
      .where(and(...conditions))
      .orderBy(desc(jointOperatingAgreements.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return (rows as Row[]).map((r) => this.mapRow(r));
  }
}
