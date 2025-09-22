import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { Well } from '../../domain/entities/well.entity';
import { ApiNumber } from '../../domain/value-objects/api-number';
import { WellStatus, WellType } from '../../domain/enums/well-status.enum';

import { wells } from '../../database/schema';

/**
 * Well Repository Implementation
 * Implements well data access using Drizzle ORM
 */
@Injectable()
export class WellRepositoryImpl implements WellRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<Record<string, never>>,
  ) {}

  async save(well: Well): Promise<void> {
    const wellData = {
      id: well.getId(),
      apiNumber: well.getApiNumber().getValue(),
      name: well.getName(),
      operatorId: well.getOperatorId(),
      leaseId: well.getLeaseId(),
      wellType: well.getWellType(),
      status: well.getStatus(),
      location: well.getLocation().toObject(),
      spudDate: well.getSpudDate(),
      completionDate: well.getCompletionDate(),
      totalDepth: well.getTotalDepth(),
      updatedAt: well.getUpdatedAt(),
      version: well.getVersion(),
    };

    // Check if well exists
    const existing = await this.db
      .select({ id: wells.id })
      .from(wells)
      .where(eq(wells.id, well.getId()))
      .limit(1);

    if (existing.length > 0) {
      // Update existing well
      await this.db
        .update(wells)
        .set(wellData)
        .where(eq(wells.id, well.getId()));
    } else {
      // Insert new well
      await this.db.insert(wells).values({
        ...wellData,
      });
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
      .where(eq(wells.operatorId, operatorId));

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
      conditions.push(eq(wells.operatorId, filters.operatorId));
    }
    if (filters?.status) {
      conditions.push(eq(wells.status, filters.status));
    }
    if (filters?.wellType) {
      conditions.push(eq(wells.wellType, filters.wellType));
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
    const locationData = row.location as {
      coordinates: { latitude: number; longitude: number };
      address?: string;
      county?: string;
      state?: string;
      country?: string;
    };
    // Note: Location object construction is handled by Well.fromPersistence

    return Well.fromPersistence({
      id: row.id as string,
      apiNumber: row.apiNumber as string,
      name: row.name as string,
      operatorId: row.operatorId as string,
      leaseId: row.leaseId as string | undefined,
      wellType: row.wellType as WellType,
      status: row.status as WellStatus,
      location: locationData,
      spudDate: row.spudDate as Date | undefined,
      completionDate: row.completionDate as Date | undefined,
      totalDepth: row.totalDepth as number | undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
      version: row.version as number,
    });
  }
}
