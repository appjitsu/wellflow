import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { jibStatements } from '../../database/schemas/jib-statements';
import {
  JibStatement,
  deserializeLineItems,
} from '../../domain/entities/jib-statement.entity';
import type { JibLineItem } from '../../domain/entities/jib-statement.entity';
import type { IJibStatementRepository } from '../../domain/repositories/jib-statement.repository.interface';
import { DatabaseService } from '../../database/database.service';

// Row type
type Row = typeof jibStatements.$inferSelect;

@Injectable()
export class JibStatementRepository implements IJibStatementRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private mapRow(row: Row): JibStatement {
    return new JibStatement({
      id: row.id,
      organizationId: row.organizationId,
      leaseId: row.leaseId,
      partnerId: row.partnerId,
      statementPeriodStart: row.statementPeriodStart,
      statementPeriodEnd: row.statementPeriodEnd,
      grossRevenue: row.grossRevenue,
      netRevenue: row.netRevenue,
      workingInterestShare: row.workingInterestShare,
      royaltyShare: row.royaltyShare,
      lineItems: deserializeLineItems(row.lineItems),
      status: (row.status as 'draft' | 'sent' | 'paid') ?? 'draft',
      sentAt: row.sentAt ?? null,
      paidAt: row.paidAt ?? null,
      previousBalance: row.previousBalance,
      dueDate: row.dueDate ?? null,
      currentBalance: row.currentBalance,
      cashCallId: row.cashCallId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<JibStatement | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(jibStatements)
      .where(eq(jibStatements.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRow(row) : null;
  }

  async create(input: {
    organizationId: string;
    leaseId: string;
    partnerId: string;
    statementPeriodStart: string;
    statementPeriodEnd: string;
    dueDate?: string | null;
    grossRevenue?: string;
    netRevenue?: string;
    workingInterestShare?: string;
    royaltyShare?: string;
    previousBalance?: string;
    currentBalance?: string;
    lineItems?: JibLineItem[] | null;
    status?: 'draft' | 'sent' | 'paid';
    sentAt?: Date;
    paidAt?: Date;
  }): Promise<JibStatement> {
    const db = this.databaseService.getDb();
    const rows = await db
      .insert(jibStatements)
      .values({
        organizationId: input.organizationId,
        leaseId: input.leaseId,
        partnerId: input.partnerId,
        statementPeriodStart: input.statementPeriodStart,
        statementPeriodEnd: input.statementPeriodEnd,
        dueDate: input.dueDate ?? null,
        grossRevenue: input.grossRevenue,
        netRevenue: input.netRevenue,
        workingInterestShare: input.workingInterestShare,
        royaltyShare: input.royaltyShare,
        previousBalance: input.previousBalance,
        currentBalance: input.currentBalance,
        lineItems: input.lineItems
          ? input.lineItems.map((item) => ({ ...item }))
          : null,
        status: input.status,
        sentAt: input.sentAt,
        paidAt: input.paidAt,
      })
      .returning();
    return this.mapRow(rows[0] as Row);
  }

  async save(entity: JibStatement): Promise<JibStatement> {
    const data = entity.toPersistence();
    if (!data.id) {
      throw new Error(
        'Insert for JibStatement is not supported via repository',
      );
    }

    const db = this.databaseService.getDb();
    await db
      .update(jibStatements)
      .set({
        currentBalance: data.currentBalance,
        cashCallId: data.cashCallId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(jibStatements.id, data.id));
    return entity;
  }
}
