import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { chainOfTitleEntries } from '../../database/schemas/chain-of-title';
import {
  ChainOfTitleEntry,
  type RecordingInfo,
} from '../../domain/entities/chain-of-title-entry.entity';
import type { ChainOfTitleRepository } from '../../domain/repositories/chain-of-title.repository.interface';

@Injectable()
export class ChainOfTitleRepositoryImpl implements ChainOfTitleRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private toDomain(
    row: typeof chainOfTitleEntries.$inferSelect,
  ): ChainOfTitleEntry {
    return new ChainOfTitleEntry({
      id: row.id,
      organizationId: row.organizationId,
      leaseId: row.leaseId,
      instrumentType: row.instrumentType,
      instrumentDate: new Date(row.instrumentDate),
      grantor: row.grantor,
      grantee: row.grantee,
      legalDescriptionRef: row.legalDescriptionRef ?? undefined,
      recordingInfo: row.recordingInfo as RecordingInfo | undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.createdAt),
    });
  }

  async addEntry(entry: ChainOfTitleEntry): Promise<ChainOfTitleEntry> {
    const values: typeof chainOfTitleEntries.$inferInsert = {
      id: entry.getId(),
      organizationId: entry.getOrganizationId(),
      leaseId: entry.getLeaseId(),
      instrumentType: entry.getInstrumentType(),
      instrumentDate: entry
        .getInstrumentDate()
        .toISOString()
        .split('T')[0] as string,
      grantor: entry.getGrantor(),
      grantee: entry.getGrantee(),
      legalDescriptionRef: entry.getLegalDescriptionRef(),
      recordingInfo: entry.getRecordingInfo(),
      notes: entry.getNotes(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const inserted = await this.db
      .insert(chainOfTitleEntries)
      .values(values)
      .returning();
    const row = inserted[0];
    if (!row) throw new Error('Failed to insert chain of title entry');
    return this.toDomain(row);
  }

  async findByLeaseId(
    leaseId: string,
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ChainOfTitleEntry[]> {
    const rows = await this.db
      .select()
      .from(chainOfTitleEntries)
      .where(
        and(
          eq(chainOfTitleEntries.leaseId, leaseId),
          eq(chainOfTitleEntries.organizationId, organizationId),
        ),
      )
      .offset(options?.offset ?? 0)
      .limit(options?.limit ?? 100)
      .orderBy(chainOfTitleEntries.instrumentDate);

    return rows.map((r) => this.toDomain(r));
  }
}
