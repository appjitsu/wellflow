import { Injectable } from '@nestjs/common';
import { eq, and, desc, count } from 'drizzle-orm';
import { IAfeApprovalRepository } from '../../domain/repositories/afe-approval.repository.interface';
import { AfeApproval } from '../../domain/entities/afe-approval.entity';
import { AfeApprovalStatus } from '../../domain/enums/afe-status.enum';
import { DatabaseService } from '../../database/database.service';

import { afeApprovals } from '../../database/schemas/afe-approvals';

/**
 * AFE Approval Domain Repository Implementation
 * Implements the domain repository interface for AFE approvals
 */
@Injectable()
export class AfeApprovalDomainRepository implements IAfeApprovalRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Save an AFE approval entity
   */
  async save(approval: AfeApproval): Promise<AfeApproval> {
    const persistenceData = approval.toPersistence();

    // Check if approval exists
    const db = this.databaseService.getDb();
    const existing = await db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.id, persistenceData.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing approval
      const updated = await db
        .update(afeApprovals)
        .set({
          approvalStatus: persistenceData.approvalStatus,
          approvedAmount: persistenceData.approvedAmount,
          approvalDate: persistenceData.approvalDate,
          comments: persistenceData.comments,
          approvedByUserId: persistenceData.approvedByUserId,
          updatedAt: new Date(),
        })
        .where(eq(afeApprovals.id, persistenceData.id))
        .returning();

      if (updated.length === 0) {
        throw new Error('Failed to update AFE approval');
      }
      const firstUpdated = updated[0];
      if (!firstUpdated) {
        throw new Error('Failed to update AFE approval');
      }
      return this.toDomainEntity(firstUpdated);
    } else {
      // Create new approval
      const created = await db
        .insert(afeApprovals)
        .values({
          id: persistenceData.id,
          afeId: persistenceData.afeId,
          partnerId: persistenceData.partnerId,
          approvalStatus: persistenceData.approvalStatus,
          approvedAmount: persistenceData.approvedAmount,
          approvalDate: persistenceData.approvalDate,
          comments: persistenceData.comments,
          approvedByUserId: persistenceData.approvedByUserId,
          createdAt: persistenceData.createdAt,
          updatedAt: persistenceData.updatedAt,
        })
        .returning();

      if (created.length === 0) {
        throw new Error('Failed to create AFE approval');
      }
      const firstCreated = created[0];
      if (!firstCreated) {
        throw new Error('Failed to create AFE approval');
      }
      return this.toDomainEntity(firstCreated);
    }
  }

  /**
   * Find approval by ID
   */
  async findById(id: string): Promise<AfeApproval | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.id, id))
      .limit(1);

    const firstResult = result[0];
    return firstResult ? this.toDomainEntity(firstResult) : null;
  }

  /**
   * Find approval by AFE and partner
   */
  async findByAfeAndPartner(
    afeId: string,
    partnerId: string,
  ): Promise<AfeApproval | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(afeApprovals)
      .where(
        and(
          eq(afeApprovals.afeId, afeId),
          eq(afeApprovals.partnerId, partnerId),
        ),
      )
      .limit(1);

    const firstResult = result[0];
    return firstResult ? this.toDomainEntity(firstResult) : null;
  }

  /**
   * Find all approvals for an AFE
   */
  async findByAfeId(afeId: string): Promise<AfeApproval[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.afeId, afeId))
      .orderBy(desc(afeApprovals.createdAt));

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find approvals by partner
   */
  async findByPartnerId(partnerId: string): Promise<AfeApproval[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.partnerId, partnerId))
      .orderBy(desc(afeApprovals.createdAt));

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find approvals by status
   */
  async findByStatus(status: AfeApprovalStatus): Promise<AfeApproval[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.approvalStatus, status))
      .orderBy(desc(afeApprovals.createdAt));

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find pending approvals for partner
   */
  async findPendingByPartnerId(partnerId: string): Promise<AfeApproval[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(afeApprovals)
      .where(
        and(
          eq(afeApprovals.partnerId, partnerId),
          eq(afeApprovals.approvalStatus, AfeApprovalStatus.PENDING),
        ),
      )
      .orderBy(desc(afeApprovals.createdAt));

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Delete approval by ID
   */
  async delete(id: string): Promise<void> {
    const db = this.databaseService.getDb();
    await db.delete(afeApprovals).where(eq(afeApprovals.id, id));
  }

  /**
   * Delete all approvals for an AFE
   */
  async deleteByAfeId(afeId: string): Promise<void> {
    const db = this.databaseService.getDb();
    await db.delete(afeApprovals).where(eq(afeApprovals.afeId, afeId));
  }

  /**
   * Find overdue approvals (pending beyond deadline)
   */
  async findOverdueApprovals(deadlineDate: Date): Promise<AfeApproval[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(afeApprovals)
      .where(
        and(
          eq(afeApprovals.approvalStatus, AfeApprovalStatus.PENDING),
          // Assuming createdAt is used as the deadline reference
          // In production, you might have a separate deadline field
        ),
      )
      .orderBy(desc(afeApprovals.createdAt));

    // Filter by deadline in application logic for simplicity
    const overdueApprovals = results.filter(
      (approval) => approval.createdAt < deadlineDate,
    );

    return overdueApprovals.map((row) => this.toDomainEntity(row));
  }

  /**
   * Count approvals by criteria
   */
  async count(criteria?: {
    afeId?: string;
    partnerId?: string;
    status?: AfeApprovalStatus;
  }): Promise<number> {
    const conditions = [];

    if (criteria?.afeId) {
      conditions.push(eq(afeApprovals.afeId, criteria.afeId));
    }

    if (criteria?.partnerId) {
      conditions.push(eq(afeApprovals.partnerId, criteria.partnerId));
    }

    if (criteria?.status) {
      conditions.push(eq(afeApprovals.approvalStatus, criteria.status));
    }

    const db = this.databaseService.getDb();
    const result = await db
      .select({ count: count() })
      .from(afeApprovals)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.count || 0;
  }

  /**
   * Check if approval exists for AFE and partner
   */
  async existsByAfeAndPartner(
    afeId: string,
    partnerId: string,
  ): Promise<boolean> {
    const result = await this.findByAfeAndPartner(afeId, partnerId);
    return result !== null;
  }

  /**
   * Get approval statistics for an AFE
   */
  async getApprovalStats(afeId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    conditional: number;
  }> {
    const approvals = await this.findByAfeId(afeId);

    return {
      total: approvals.length,
      pending: approvals.filter(
        (a) => a.getApprovalStatus() === AfeApprovalStatus.PENDING,
      ).length,
      approved: approvals.filter(
        (a) => a.getApprovalStatus() === AfeApprovalStatus.APPROVED,
      ).length,
      rejected: approvals.filter(
        (a) => a.getApprovalStatus() === AfeApprovalStatus.REJECTED,
      ).length,
      conditional: approvals.filter(
        (a) => a.getApprovalStatus() === AfeApprovalStatus.CONDITIONAL,
      ).length,
    };
  }

  /**
   * Check if all required approvals are complete
   */
  async areAllApprovalsComplete(afeId: string): Promise<boolean> {
    const stats = await this.getApprovalStats(afeId);
    return stats.pending === 0;
  }

  /**
   * Check if AFE has sufficient approvals
   */
  async hasSufficientApprovals(afeId: string): Promise<boolean> {
    const stats = await this.getApprovalStats(afeId);
    // Simple majority rule - can be enhanced with more complex business rules
    return stats.approved > stats.rejected;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: typeof afeApprovals.$inferSelect): AfeApproval {
    return AfeApproval.fromPersistence({
      id: row.id,
      afeId: row.afeId,
      partnerId: row.partnerId,
      approvalStatus: row.approvalStatus as AfeApprovalStatus,
      approvedAmount: row.approvedAmount || undefined,
      approvalDate: row.approvalDate || undefined,
      comments: row.comments || undefined,
      approvedByUserId: row.approvedByUserId || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
