import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { Well } from '../../domain/entities/well.entity';
import { ApiNumber } from '../../domain/value-objects/api-number';
import { WellStatus, WellType } from '../../domain/enums/well-status.enum';
import { AuditLogService } from '../../application/services/audit-log.service';
import { AuditResourceType } from '../../domain/entities/audit-log.entity';

import { wells } from '../../database/schema';
import * as schema from '../../database/schema';

/**
 * Well Repository Implementation
 * Implements well data access using Drizzle ORM
 */
@Injectable()
export class WellRepositoryImpl implements WellRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly auditLogService?: AuditLogService,
  ) {}

  protected async logAuditAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    record: Record<string, unknown>,
    changes?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!this.auditLogService) {
      return; // Audit logging not available
    }

    try {
      const resourceId =
        (record as { id?: string })?.id ||
        (record as { getId?: () => string })?.getId?.() ||
        'unknown';

      switch (action) {
        case 'CREATE':
          await this.auditLogService.logCreate(
            this.getResourceType(),
            resourceId,
            changes?.newValues || record,
          );
          break;
        case 'UPDATE':
          await this.auditLogService.logUpdate(
            this.getResourceType(),
            resourceId,
            changes?.oldValues || {},
            changes?.newValues || record,
          );
          break;
        case 'DELETE':
          await this.auditLogService.logDelete(
            this.getResourceType(),
            resourceId,
            changes?.oldValues || record,
          );
          break;
      }
    } catch (error) {
      // Log audit failure but don't fail the operation
      console.error('Failed to log audit action:', error);
    }
  }

  protected getResourceType(): AuditResourceType {
    return AuditResourceType.WELL;
  }

  private mapWellStatusToDatabase(
    status: WellStatus,
  ): 'active' | 'inactive' | 'plugged' | 'drilling' {
    switch (status) {
      case WellStatus.ACTIVE:
      case WellStatus.PRODUCING:
        return 'active';
      case WellStatus.INACTIVE:
      case WellStatus.SHUT_IN:
        return 'inactive';
      case WellStatus.PLUGGED:
      case WellStatus.PERMANENTLY_ABANDONED:
        return 'plugged';
      case WellStatus.DRILLING:
        return 'drilling';
      default:
        return 'active'; // Default fallback
    }
  }

  async save(well: Well): Promise<void> {
    // Map domain model to database schema
    const wellData = {
      id: well.getId().getValue(),
      organizationId: well.getOperatorId(), // Map operatorId to organizationId in schema
      apiNumber: well.getApiNumber().getValue(),
      wellName: well.getName(), // Map name to wellName in schema
      leaseId: well.getLeaseId(),
      wellType: well.getWellType(),
      status: this.mapWellStatusToDatabase(well.getStatus()),
      spudDate: well.getSpudDate()?.toISOString().split('T')[0] || null, // Convert Date to string
      completionDate:
        well.getCompletionDate()?.toISOString().split('T')[0] || null, // Convert Date to string
      totalDepth: well.getTotalDepth()?.toString() || null, // Convert number to decimal string
      latitude: well.getLocation().getCoordinates().getLatitude().toString(),
      longitude: well.getLocation().getCoordinates().getLongitude().toString(),
      updatedAt: well.getUpdatedAt(),
    };

    // Check if well exists
    const existing = await this.db
      .select()
      .from(wells)
      .where(eq(wells.id, well.getId().getValue()))
      .limit(1);

    const existingWell = existing.length > 0 ? existing[0] : null;

    if (existingWell) {
      // Update existing well
      await this.db
        .update(wells)
        .set(wellData)
        .where(eq(wells.id, well.getId().getValue()));

      // Audit logging for update
      await this.logAuditAction('UPDATE', wellData, {
        oldValues: existingWell,
        newValues: wellData,
      });
    } else {
      // Insert new well
      await this.db.insert(wells).values({
        ...wellData,
      });

      // Audit logging for creation
      await this.logAuditAction('CREATE', wellData, { newValues: wellData });
    }
  }

  async findById(id: string): Promise<Well | null> {
    const result = await this.db
      .select()
      .from(wells)
      .where(eq(wells.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const wellData = result[0];
    if (!wellData) {
      return null;
    }

    return this.mapToEntity(wellData);
  }

  async findByApiNumber(apiNumber: ApiNumber): Promise<Well | null> {
    const result = await this.db
      .select()
      .from(wells)
      .where(eq(wells.apiNumber, apiNumber.getValue()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const wellData = result[0];
    if (!wellData) {
      return null;
    }

    return this.mapToEntity(wellData);
  }

  async findByOperatorId(operatorId: string): Promise<Well[]> {
    const result = await this.db
      .select()
      .from(wells)
      .where(eq(wells.organizationId, operatorId)); // Use organizationId instead of operatorId

    return result.map((row) => this.mapToEntity(row));
  }

  async findByLeaseId(leaseId: string): Promise<Well[]> {
    const result = await this.db
      .select()
      .from(wells)
      .where(eq(wells.leaseId, leaseId));

    return result.map((row) => this.mapToEntity(row));
  }

  async findByLocation(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
  ): Promise<Well[]> {
    // Using PostGIS-style distance calculation
    // This is a simplified version - in production, you'd use proper PostGIS functions
    const result = await this.db
      .select()
      .from(wells)
      .where(
        sql`
          (6371 * acos(
            cos(radians(${centerLat})) * 
            cos(radians((location->>'coordinates')::json->>'latitude')::float) * 
            cos(radians((location->>'coordinates')::json->>'longitude')::float) - radians(${centerLng})) + 
            sin(radians(${centerLat})) * 
            sin(radians((location->>'coordinates')::json->>'latitude')::float)
          )) <= ${radiusKm}
        `,
      );

    return result.map((row) => this.mapToEntity(row));
  }

  async findWithPagination(
    offset: number,
    limit: number,
    filters?: {
      operatorId?: string;
      status?: string;
      wellType?: string;
    },
  ): Promise<{ wells: Well[]; total: number }> {
    // Build where conditions
    const conditions: Array<ReturnType<typeof eq>> = [];

    if (filters?.operatorId) {
      conditions.push(eq(wells.organizationId, filters.operatorId)); // Use organizationId
    }
    if (filters?.status) {
      conditions.push(
        eq(
          wells.status,
          this.mapWellStatusToDatabase(filters.status as WellStatus),
        ),
      );
    }
    if (filters?.wellType) {
      conditions.push(eq(wells.wellType, filters.wellType as WellType));
    }

    // Build where clause
    let whereClause:
      | ReturnType<typeof and>
      | ReturnType<typeof eq>
      | undefined = undefined;
    if (conditions.length === 1) {
      whereClause = conditions[0];
    } else if (conditions.length > 1) {
      whereClause = and(...conditions);
    }

    // Execute queries
    const wellsQuery = whereClause
      ? this.db
          .select()
          .from(wells)
          .where(whereClause)
          .offset(offset)
          .limit(limit)
      : this.db.select().from(wells).offset(offset).limit(limit);

    const countQuery = whereClause
      ? this.db.select({ count: count() }).from(wells).where(whereClause)
      : this.db.select({ count: count() }).from(wells);

    const [wellsResult, totalResult] = await Promise.all([
      wellsQuery,
      countQuery,
    ]);

    return {
      wells: wellsResult.map((row) => this.mapToEntity(row)),
      total: totalResult[0]?.count || 0,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(wells).where(eq(wells.id, id));
  }

  async existsByApiNumber(apiNumber: ApiNumber): Promise<boolean> {
    const result = await this.db
      .select({ id: wells.id })
      .from(wells)
      .where(eq(wells.apiNumber, apiNumber.getValue()))
      .limit(1);

    return result.length > 0;
  }

  private mapToEntity(row: Record<string, unknown>): Well {
    // Create location data from latitude/longitude fields
    const locationData = {
      coordinates: {
        latitude: parseFloat(row.latitude as string) || 0,
        longitude: parseFloat(row.longitude as string) || 0,
      },
      address: undefined,
      county: undefined,
      state: undefined,
      country: 'USA',
    };

    return Well.fromPersistence({
      id: row.id as string,
      apiNumber: row.apiNumber as string,
      name: row.wellName as string, // Map wellName to name
      operatorId: row.organizationId as string, // Map organizationId to operatorId
      leaseId: row.leaseId as string | undefined,
      wellType: row.wellType as WellType,
      status: row.status as WellStatus,
      location: locationData,
      spudDate: row.spudDate ? new Date(row.spudDate as string) : undefined,
      completionDate: row.completionDate
        ? new Date(row.completionDate as string)
        : undefined,
      totalDepth: row.totalDepth
        ? parseFloat(row.totalDepth as string)
        : undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      version: 1, // Default version since schema doesn't have version field
    });
  }
}
