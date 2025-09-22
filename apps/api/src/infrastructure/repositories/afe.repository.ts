import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, desc, sum } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { afes, afeLineItems, afeApprovals } from '../../database/schema';

/**
 * AFE (Authorization for Expenditure) Repository Implementation
 * Handles AFE management with line items and approvals
 */
@Injectable()
export class AfeRepository extends BaseRepository<typeof afes> {
  constructor(db: any) {
    super(db, afes);
  }

  /**
   * Find AFE with line items and approvals
   */
  async findWithDetails(afeId: string): Promise<{
    afe: typeof afes.$inferSelect | null;
    lineItems: (typeof afeLineItems.$inferSelect)[];
    approvals: (typeof afeApprovals.$inferSelect)[];
  }> {
    const [afe, lineItems, approvals] = await Promise.all([
      this.findById(afeId),
      this.db.select().from(afeLineItems).where(eq(afeLineItems.afeId, afeId)),
      this.db.select().from(afeApprovals).where(eq(afeApprovals.afeId, afeId)),
    ]);

    return { afe, lineItems, approvals };
  }

  /**
   * Find AFEs by well ID
   */
  async findByWellId(wellId: string): Promise<(typeof afes.$inferSelect)[]> {
    return this.db
      .select()
      .from(afes)
      .where(eq(afes.wellId, wellId))
      .orderBy(desc(afes.createdAt));
  }

  /**
   * Find AFEs by status
   */
  async findByStatus(
    organizationId: string,
    status: string,
  ): Promise<(typeof afes.$inferSelect)[]> {
    return this.db
      .select()
      .from(afes)
      .where(
        and(eq(afes.organizationId, organizationId), eq(afes.status, status)),
      )
      .orderBy(desc(afes.createdAt));
  }

  /**
   * Find AFEs by date range
   */
  async findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<(typeof afes.$inferSelect)[]> {
    return this.db
      .select()
      .from(afes)
      .where(
        and(
          eq(afes.organizationId, organizationId),
          gte(afes.createdAt, startDate),
          lte(afes.createdAt, endDate),
        ),
      )
      .orderBy(desc(afes.createdAt));
  }

  /**
   * Get AFE total costs
   */
  async getTotalCosts(afeId: string): Promise<{
    estimatedTotal: number;
    actualTotal: number;
    lineItemsTotal: number;
  }> {
    const [afeData, lineItemsSum] = await Promise.all([
      this.findById(afeId),
      this.db
        .select({
          total: sum(afeLineItems.estimatedCost),
        })
        .from(afeLineItems)
        .where(eq(afeLineItems.afeId, afeId)),
    ]);

    return {
      estimatedTotal: Number(afeData?.estimatedCost || 0),
      actualTotal: Number(afeData?.actualCost || 0),
      lineItemsTotal: Number(lineItemsSum[0]?.total || 0),
    };
  }

  /**
   * Create AFE with line items
   */
  async createWithLineItems(
    afeData: typeof afes.$inferInsert,
    lineItems: (typeof afeLineItems.$inferInsert)[],
  ): Promise<{
    afe: typeof afes.$inferSelect;
    lineItems: (typeof afeLineItems.$inferSelect)[];
  }> {
    // Create AFE first
    const afe = await this.create(afeData);

    // Create line items with AFE ID
    const createdLineItems = await this.db
      .insert(afeLineItems)
      .values(
        lineItems.map((item) => ({
          ...item,
          afeId: afe.id,
        })),
      )
      .returning();

    return { afe, lineItems: createdLineItems };
  }

  /**
   * Update AFE status
   */
  async updateStatus(
    afeId: string,
    status: string,
    updatedBy: string,
  ): Promise<typeof afes.$inferSelect | null> {
    return this.update(afeId, {
      status,
      updatedAt: new Date(),
    });
  }

  /**
   * Get AFE approval status
   */
  async getApprovalStatus(afeId: string): Promise<{
    totalApprovals: number;
    pendingApprovals: number;
    approvedApprovals: number;
    rejectedApprovals: number;
  }> {
    const approvals = await this.db
      .select()
      .from(afeApprovals)
      .where(eq(afeApprovals.afeId, afeId));

    return {
      totalApprovals: approvals.length,
      pendingApprovals: approvals.filter((a) => a.status === 'pending').length,
      approvedApprovals: approvals.filter((a) => a.status === 'approved')
        .length,
      rejectedApprovals: approvals.filter((a) => a.status === 'rejected')
        .length,
    };
  }

  /**
   * Find AFEs requiring approval from specific partner
   */
  async findRequiringApproval(
    organizationId: string,
    partnerId: string,
  ): Promise<(typeof afes.$inferSelect)[]> {
    // This would typically join with partner relationships
    // For now, returning AFEs in 'pending_approval' status
    return this.findByStatus(organizationId, 'pending_approval');
  }
}
