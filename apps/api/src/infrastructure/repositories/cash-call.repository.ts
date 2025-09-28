import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { cashCalls } from '../../database/schemas/cash-calls';
import {
  CashCall,
  CashCallStatus,
  CashCallType,
  CashCallConsentStatus,
} from '../../domain/entities/cash-call.entity';
import type { ICashCallRepository } from '../../domain/repositories/cash-call.repository.interface';
import { DatabaseService } from '../../database/database.service';

type Row = typeof cashCalls.$inferSelect;

@Injectable()
export class CashCallRepository implements ICashCallRepository {
  constructor(private readonly databaseService: DatabaseService) {}
  private mapRow(row: Row): CashCall {
    return CashCall.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      leaseId: row.leaseId,
      partnerId: row.partnerId,
      billingMonth: row.billingMonth,
      dueDate: row.dueDate ?? null,
      amount: row.amount,
      type: row.type as CashCallType,
      status: row.status as CashCallStatus,
      interestRatePercent: row.interestRatePercent ?? null,
      consentRequired: row.consentRequired,
      consentStatus:
        (row.consentStatus as CashCallConsentStatus | null) ??
        (row.consentRequired ? 'REQUIRED' : 'NOT_REQUIRED'),
      consentReceivedAt: row.consentReceivedAt ?? null,
      approvedAt: row.approvedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
  async save(entity: CashCall): Promise<CashCall> {
    const data = entity.toPersistence();
    const existing = data.id ? await this.findById(data.id) : null;

    if (existing) {
      const recordId = data.id;
      if (!recordId) {
        throw new Error('CashCall ID is required for updates');
      }
      const db = this.databaseService.getDb();
      await db
        .update(cashCalls)
        .set({
          organizationId: data.organizationId,
          leaseId: data.leaseId,
          partnerId: data.partnerId,
          billingMonth: data.billingMonth,
          dueDate: data.dueDate ?? null,
          amount: data.amount,
          type: data.type,
          status: data.status,
          interestRatePercent: data.interestRatePercent ?? '0.00',
          consentRequired: data.consentRequired,
          consentStatus:
            data.consentStatus ??
            (data.consentRequired ? 'REQUIRED' : 'NOT_REQUIRED'),
          consentReceivedAt: data.consentReceivedAt ?? null,
          approvedAt: data.approvedAt,
          updatedAt: new Date(),
        })
        .where(eq(cashCalls.id, recordId));
      return entity;
    }

    const db = this.databaseService.getDb();
    const rows = await db
      .insert(cashCalls)
      .values({
        organizationId: data.organizationId,
        leaseId: data.leaseId,
        partnerId: data.partnerId,
        billingMonth: data.billingMonth,
        dueDate: data.dueDate ?? null,
        amount: data.amount,
        type: data.type,
        status: data.status,
        interestRatePercent: data.interestRatePercent ?? '0.00',
        consentRequired: data.consentRequired,
        consentStatus:
          data.consentStatus ??
          (data.consentRequired ? 'REQUIRED' : 'NOT_REQUIRED'),
        consentReceivedAt: data.consentReceivedAt ?? null,
        approvedAt: data.approvedAt,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      })
      .returning();
    return this.mapRow(rows[0] as Row);
  }
  async findById(id: string): Promise<CashCall | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(cashCalls)
      .where(eq(cashCalls.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      leaseId?: string;
      partnerId?: string;
      status?: Row['status'];
      limit?: number;
      offset?: number;
    },
  ): Promise<CashCall[]> {
    const conditions = [eq(cashCalls.organizationId, organizationId)];
    if (options?.leaseId)
      conditions.push(eq(cashCalls.leaseId, options.leaseId));
    if (options?.partnerId)
      conditions.push(eq(cashCalls.partnerId, options.partnerId));
    if (options?.status) conditions.push(eq(cashCalls.status, options.status));

    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(cashCalls)
      .where(and(...conditions))
      .orderBy(desc(cashCalls.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return (rows as Row[]).map((r) => this.mapRow(r));
  }
}
