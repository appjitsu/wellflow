import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ownerPayments } from '../../database/schemas/owner-payments';
import {
  OwnerPayment,
  OwnerPaymentStatus,
  OwnerPaymentMethod,
} from '../../domain/entities/owner-payment.entity';
import type { IOwnerPaymentRepository } from '../../domain/repositories/owner-payment.repository.interface';
import { DatabaseService } from '../../database/database.service';

// Row type
type Row = typeof ownerPayments.$inferSelect;

@Injectable()
export class OwnerPaymentRepository implements IOwnerPaymentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private mapRow(row: Row): OwnerPayment {
    return OwnerPayment.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      partnerId: row.partnerId,
      revenueDistributionId: row.revenueDistributionId,
      method: row.paymentMethod as OwnerPaymentMethod,
      status: row.status as OwnerPaymentStatus,
      grossAmount: row.grossAmount,
      deductionsAmount: row.deductions,
      taxWithheldAmount: row.taxWithholding,
      netAmount: row.netAmount,
      checkNumber: row.checkNumber ?? null,
      achTraceNumber: row.achTraceNumber ?? null,
      memo: null,
      paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,
      clearedDate: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(entity: OwnerPayment): Promise<OwnerPayment> {
    const data = entity.toPersistence();
    const existing = data.id ? await this.findById(data.id) : null;

    const formatDate = (d: Date | null | undefined): string | null =>
      d ? d.toISOString().slice(0, 10) : null;

    if (existing) {
      const recordId = data.id;
      if (!recordId) {
        throw new Error('OwnerPayment ID is required for updates');
      }
      const db = this.databaseService.getDb();
      await db
        .update(ownerPayments)
        .set({
          organizationId: data.organizationId,
          partnerId: data.partnerId,
          revenueDistributionId: data.revenueDistributionId,
          paymentMethod: data.method,
          status: data.status,
          grossAmount: data.grossAmount,
          deductions: data.deductionsAmount ?? '0.00',
          taxWithholding: data.taxWithheldAmount ?? '0.00',
          netAmount: data.netAmount,
          checkNumber: data.checkNumber,
          achTraceNumber: data.achTraceNumber,
          paymentDate: formatDate(data.paymentDate),
          updatedAt: new Date(),
        })
        .where(eq(ownerPayments.id, recordId));
      return entity;
    }

    const db = this.databaseService.getDb();
    const rows = await db
      .insert(ownerPayments)
      .values({
        organizationId: data.organizationId,
        partnerId: data.partnerId,
        revenueDistributionId: data.revenueDistributionId,
        paymentMethod: data.method,
        status: data.status,
        grossAmount: data.grossAmount,
        deductions: data.deductionsAmount ?? '0.00',
        taxWithholding: data.taxWithheldAmount ?? '0.00',
        netAmount: data.netAmount,
        checkNumber: data.checkNumber,
        achTraceNumber: data.achTraceNumber,
        paymentDate: formatDate(data.paymentDate),
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
      })
      .returning();
    return this.mapRow(rows[0] as Row);
  }

  async findById(id: string): Promise<OwnerPayment | null> {
    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(ownerPayments)
      .where(eq(ownerPayments.id, id))
      .limit(1);
    const row = rows[0] as Row | undefined;
    return row ? this.mapRow(row) : null;
  }

  async findByOrganizationId(
    organizationId: string,
    options?: {
      partnerId?: string;
      status?: Row['status'];
      limit?: number;
      offset?: number;
    },
  ): Promise<OwnerPayment[]> {
    const conditions = [eq(ownerPayments.organizationId, organizationId)];
    if (options?.partnerId)
      conditions.push(eq(ownerPayments.partnerId, options.partnerId));
    if (options?.status)
      conditions.push(eq(ownerPayments.status, options.status));

    const db = this.databaseService.getDb();
    const rows = await db
      .select()
      .from(ownerPayments)
      .where(and(...conditions))
      .orderBy(desc(ownerPayments.updatedAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return (rows as Row[]).map((r) => this.mapRow(r));
  }
}
