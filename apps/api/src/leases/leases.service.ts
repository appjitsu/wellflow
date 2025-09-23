import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { leases } from '../database/schemas/leases';
import { TenantContextService } from '../common/tenant/tenant-context.service';

export interface CreateLeaseDto {
  name: string;
  leaseNumber?: string;
  lessor: string;
  lessee: string;
  acreage?: string;
  royaltyRate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  legalDescription?: string;
}

export interface UpdateLeaseDto {
  name?: string;
  leaseNumber?: string;
  lessor?: string;
  lessee?: string;
  acreage?: string;
  royaltyRate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  status?: string;
  legalDescription?: string;
}

@Injectable()
export class LeasesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new lease
   */
  async createLease(dto: CreateLeaseDto) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [newLease] = await db
      .insert(leases)
      .values({
        ...dto,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newLease) {
      throw new Error('Failed to create lease');
    }

    return newLease;
  }

  /**
   * Get lease by ID with tenant validation
   */
  async getLeaseById(id: string) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [lease] = await db
      .select()
      .from(leases)
      .where(and(eq(leases.id, id), eq(leases.organizationId, organizationId)))
      .limit(1);

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  /**
   * Get all leases for current organization
   */
  async getLeases() {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    return db
      .select()
      .from(leases)
      .where(eq(leases.organizationId, organizationId));
  }

  /**
   * Update lease
   */
  async updateLease(id: string, dto: UpdateLeaseDto) {
    // Validate lease exists and belongs to organization
    await this.getLeaseById(id);

    const db = this.databaseService.getDb();
    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    const [updatedLease] = await db
      .update(leases)
      .set(updateData)
      .where(eq(leases.id, id))
      .returning();

    if (!updatedLease) {
      throw new Error('Failed to update lease');
    }

    return updatedLease;
  }

  /**
   * Delete lease
   */
  async deleteLease(id: string) {
    // Validate lease exists and belongs to organization
    await this.getLeaseById(id);

    const db = this.databaseService.getDb();
    const [deletedLease] = await db
      .delete(leases)
      .where(eq(leases.id, id))
      .returning();

    if (!deletedLease) {
      throw new Error('Failed to delete lease');
    }

    return deletedLease;
  }

  /**
   * Get leases by status
   */
  async getLeasesByStatus(status: string) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    return db
      .select()
      .from(leases)
      .where(
        and(
          eq(leases.organizationId, organizationId),
          eq(leases.status, status),
        ),
      );
  }

  /**
   * Get expiring leases
   */
  async getExpiringLeases(days: number = 30) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return db
      .select()
      .from(leases)
      .where(
        and(
          eq(leases.organizationId, organizationId),
          // This would need a more complex query for date comparison
          // For now, returning all active leases
          eq(leases.status, 'active'),
        ),
      );
  }
}
