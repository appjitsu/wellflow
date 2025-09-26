import { Inject, Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, desc, asc, gte, lte } from 'drizzle-orm';
import type { PermitRepository } from '../../domain/repositories/permit.repository';
import { Permit } from '../../domain/entities/permit.entity';
import { PermitStatus } from '../../domain/value-objects/permit-status.vo';
import { PermitType } from '../../domain/value-objects/permit-type.vo';
import { permits as permitsTable } from '../../database/schemas/permits';
import type * as schema from '../../database/schema';

/**
 * Drizzle-based Permit Repository Implementation
 * Implements the PermitRepository interface using Drizzle ORM
 */
@Injectable()
export class PermitRepositoryImpl implements PermitRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Find permits expiring within specified days
   */
  async findExpiringPermits(
    days: number,
    organizationId?: string,
  ): Promise<Permit[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const conditions = [
      eq(permitsTable.status, 'approved'),
      gte(
        permitsTable.expirationDate,
        new Date().toISOString().substring(0, 10),
      ),
      lte(
        permitsTable.expirationDate,
        futureDate.toISOString().substring(0, 10),
      ),
    ];

    if (organizationId) {
      conditions.push(eq(permitsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(permitsTable)
      .where(and(...conditions))
      .orderBy(asc(permitsTable.expirationDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find permits requiring renewal (expired)
   */
  async findPermitsRequiringRenewal(
    organizationId?: string,
  ): Promise<Permit[]> {
    const conditions = [
      eq(permitsTable.status, 'approved'),
      lte(
        permitsTable.expirationDate,
        new Date().toISOString().substring(0, 10),
      ),
    ];

    if (organizationId) {
      conditions.push(eq(permitsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(permitsTable)
      .where(and(...conditions))
      .orderBy(asc(permitsTable.expirationDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Save a permit to the repository
   */
  async save(permit: Permit): Promise<void> {
    const data = {
      id: permit.id,
      organizationId: permit.organizationId,
      wellId: permit.wellId,
      permitNumber: permit.permitNumber,
      permitType: permit.permitType.value,
      status: permit.status.value,
      issuingAgency: permit.issuingAgency,
      regulatoryAuthority: permit.regulatoryAuthority,
      applicationDate: permit.applicationDate?.toISOString() || null,
      submittedDate: permit.submittedDate?.toISOString() || null,
      approvalDate: permit.approvalDate?.toISOString() || null,
      expirationDate: permit.expirationDate?.toISOString() || null,
      permitConditions: permit.permitConditions,
      complianceRequirements: permit.complianceRequirements,
      feeAmount: permit.feeAmount?.toString() || null,
      bondAmount: permit.bondAmount?.toString() || null,
      bondType: permit.bondType,
      location: permit.location,
      facilityId: permit.facilityId,
      documentIds: permit.documentIds,
      createdByUserId: permit.createdByUserId,
      createdAt: permit.createdAt,
      updatedAt: permit.updatedAt,
    };

    await this.db
      .insert(permitsTable)
      .values(data)
      .onConflictDoUpdate({
        target: permitsTable.id,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Save multiple permits within a unit of work
   */
  async saveMany(permits: Permit[]): Promise<void> {
    if (permits.length === 0) return;

    const values = permits.map((permit) => ({
      id: permit.id,
      organizationId: permit.organizationId,
      wellId: permit.wellId,
      permitNumber: permit.permitNumber,
      permitType: permit.permitType.value,
      status: permit.status.value,
      issuingAgency: permit.issuingAgency,
      regulatoryAuthority: permit.regulatoryAuthority,
      applicationDate: permit.applicationDate?.toISOString().split('T')[0], // date fields need YYYY-MM-DD format
      submittedDate: permit.submittedDate?.toISOString().split('T')[0],
      approvalDate: permit.approvalDate?.toISOString().split('T')[0],
      expirationDate: permit.expirationDate?.toISOString().split('T')[0],
      permitConditions: permit.permitConditions,
      complianceRequirements: permit.complianceRequirements,
      feeAmount: permit.feeAmount?.toString(),
      bondAmount: permit.bondAmount?.toString(),
      bondType: permit.bondType,
      location: permit.location,
      facilityId: permit.facilityId,
      documentIds: permit.documentIds,
      createdByUserId: permit.createdByUserId,
      createdAt: permit.createdAt, // timestamp fields can accept Date objects
      updatedAt: permit.updatedAt,
    }));

    await this.db.insert(permitsTable).values(values).onConflictDoNothing();
  }

  /**
   * Find a permit by its ID
   */
  async findById(id: string): Promise<Permit | null> {
    const result = await this.db
      .select()
      .from(permitsTable)
      .where(eq(permitsTable.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;

    return this.mapToDomain(row);
  }

  /**
   * Find a permit by permit number
   */
  async findByPermitNumber(permitNumber: string): Promise<Permit | null> {
    const result = await this.db
      .select()
      .from(permitsTable)
      .where(eq(permitsTable.permitNumber, permitNumber))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;

    return this.mapToDomain(row);
  }

  /**
   * Find permits by organization
   */
  async findByOrganizationId(
    organizationId: string,
    options?: {
      status?: string;
      permitType?: string;
      wellId?: string;
      issuingAgency?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<Permit[]> {
    const conditions = [eq(permitsTable.organizationId, organizationId)];

    if (options?.status) {
      conditions.push(eq(permitsTable.status, options.status));
    }

    if (options?.permitType) {
      conditions.push(eq(permitsTable.permitType, options.permitType));
    }

    if (options?.wellId) {
      conditions.push(eq(permitsTable.wellId, options.wellId));
    }

    if (options?.issuingAgency) {
      conditions.push(eq(permitsTable.issuingAgency, options.issuingAgency));
    }

    const baseQuery = this.db
      .select()
      .from(permitsTable)
      .where(and(...conditions))
      .orderBy(desc(permitsTable.createdAt));

    // Apply pagination using $dynamic() to preserve type safety
    let finalQuery = baseQuery.$dynamic();

    if (options?.limit) {
      finalQuery = finalQuery.limit(options.limit);
    }

    if (options?.offset) {
      finalQuery = finalQuery.offset(options.offset);
    }

    const results = await finalQuery;
    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find permits expiring within days
   */
  async findExpiringWithinDays(
    organizationId: string,
    daysFromNow: number,
  ): Promise<Permit[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);

    const results = await this.db
      .select()
      .from(permitsTable)
      .where(
        and(
          eq(permitsTable.organizationId, organizationId),
          gte(
            permitsTable.expirationDate,
            new Date().toISOString().substring(0, 10),
          ),
          lte(
            permitsTable.expirationDate,
            futureDate.toISOString().substring(0, 10),
          ),
        ),
      )
      .orderBy(asc(permitsTable.expirationDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find permits by status
   */
  async findByStatus(
    status: string,
    organizationId?: string,
  ): Promise<Permit[]> {
    const conditions = [eq(permitsTable.status, status)];

    if (organizationId) {
      conditions.push(eq(permitsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(permitsTable)
      .where(and(...conditions))
      .orderBy(desc(permitsTable.createdAt));
    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find permits by well ID
   */
  async findByWellId(wellId: string): Promise<Permit[]> {
    const results = await this.db
      .select()
      .from(permitsTable)
      .where(eq(permitsTable.wellId, wellId))
      .orderBy(desc(permitsTable.createdAt));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find permits requiring renewal
   */
  async findRequiringRenewal(organizationId: string): Promise<Permit[]> {
    const results = await this.db
      .select()
      .from(permitsTable)
      .where(
        and(
          eq(permitsTable.organizationId, organizationId),
          eq(permitsTable.status, 'approved'),
          lte(
            permitsTable.expirationDate,
            new Date().toISOString().substring(0, 10),
          ),
        ),
      )
      .orderBy(asc(permitsTable.expirationDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Count permits by status for organization
   */
  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const results = await this.db
      .select({
        status: permitsTable.status,
        count: sql<number>`count(*)`,
      })
      .from(permitsTable)
      .where(eq(permitsTable.organizationId, organizationId))
      .groupBy(permitsTable.status);

    return results.reduce(
      (acc, row) => {
        acc[row.status] = row.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Check if permit exists
   */
  async existsByPermitNumber(
    permitNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [eq(permitsTable.permitNumber, permitNumber)];

    if (excludeId) {
      conditions.push(sql`${permitsTable.id} != ${excludeId}`);
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permitsTable)
      .where(and(...conditions))
      .limit(1);
    return (result[0]?.count ?? 0) > 0;
  }

  /**
   * Delete permit by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(permitsTable).where(eq(permitsTable.id, id));
  }

  /**
   * Get permit statistics for organization
   */
  async getPermitStatistics(organizationId: string): Promise<{
    totalPermits: number;
    active: number;
    expired: number;
    expiringWithin30Days: number;
    pendingRenewal: number;
  }> {
    // Total permits
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permitsTable)
      .where(eq(permitsTable.organizationId, organizationId));

    const totalPermits = totalResult[0]?.count ?? 0;

    // Active permits (approved and not expired)
    const activeResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permitsTable)
      .where(
        and(
          eq(permitsTable.organizationId, organizationId),
          eq(permitsTable.status, 'approved'),
          gte(
            permitsTable.expirationDate,
            new Date().toISOString().substring(0, 10),
          ),
        ),
      );

    const activePermits = activeResult[0]?.count ?? 0;

    // Expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permitsTable)
      .where(
        and(
          eq(permitsTable.organizationId, organizationId),
          eq(permitsTable.status, 'approved'),
          gte(
            permitsTable.expirationDate,
            new Date().toISOString().substring(0, 10),
          ),
          lte(
            permitsTable.expirationDate,
            thirtyDaysFromNow.toISOString().substring(0, 10),
          ),
        ),
      );

    const expiringWithin30Days = expiringResult[0]?.count ?? 0;

    // Expired permits
    const expiredResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(permitsTable)
      .where(
        and(
          eq(permitsTable.organizationId, organizationId),
          eq(permitsTable.status, 'approved'),
          lte(
            permitsTable.expirationDate,
            new Date().toISOString().substring(0, 10),
          ),
        ),
      );

    const expiredPermits = expiredResult[0]?.count ?? 0;

    // Calculate permits requiring renewal (expired permits)
    const pendingRenewal = expiredPermits;

    return {
      totalPermits,
      active: activePermits,
      expired: expiredPermits,
      expiringWithin30Days,
      pendingRenewal,
    };
  }

  /**
   * Map database row to domain entity
   */
  private mapToDomain(row: typeof permitsTable.$inferSelect): Permit {
    const permit = new Permit(
      row.id,
      row.permitNumber,
      PermitType.fromString(row.permitType),
      row.organizationId,
      row.issuingAgency,
      row.createdByUserId || '',
      PermitStatus.fromString(row.status),
    );

    // Set additional properties, converting null to undefined
    permit.wellId = row.wellId ?? undefined;
    permit.regulatoryAuthority = row.regulatoryAuthority ?? undefined;
    permit.applicationDate = row.applicationDate
      ? new Date(row.applicationDate)
      : undefined;
    permit.submittedDate = row.submittedDate
      ? new Date(row.submittedDate)
      : undefined;
    permit.approvalDate = row.approvalDate
      ? new Date(row.approvalDate)
      : undefined;
    permit.expirationDate = row.expirationDate
      ? new Date(row.expirationDate)
      : undefined;
    permit.permitConditions =
      (row.permitConditions as Record<string, unknown>) ?? undefined;
    permit.complianceRequirements =
      (row.complianceRequirements as Record<string, unknown>) ?? undefined;
    permit.feeAmount = row.feeAmount ? parseFloat(row.feeAmount) : undefined;
    permit.bondAmount = row.bondAmount ? parseFloat(row.bondAmount) : undefined;
    permit.bondType = row.bondType ?? undefined;
    permit.location = row.location ?? undefined;
    permit.facilityId = row.facilityId ?? undefined;
    permit.documentIds = (row.documentIds as string[]) ?? undefined;
    permit.createdAt = row.createdAt;
    permit.updatedAt = row.updatedAt;

    return permit;
  }
}
