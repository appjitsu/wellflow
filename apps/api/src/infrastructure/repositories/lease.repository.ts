import { Injectable } from '@nestjs/common';
import { eq, and, lte, gte } from 'drizzle-orm';
import { leases } from '../../database/schema';
import { DatabaseService } from '../../database/database.service';
import {
  LeaseRepository as ILeaseRepository,
  CreateLeaseDto,
  UpdateLeaseDto,
  LeaseRecord,
} from '../../domain/repositories/lease.repository.interface';

/**
 * Lease Repository Implementation
 * Handles lease data with advanced querying and reporting
 */
@Injectable()
export class LeaseRepository implements ILeaseRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new lease
   */
  async create(data: CreateLeaseDto): Promise<LeaseRecord> {
    const db = this.databaseService.getDb();
    const result = await db
      .insert(leases)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] as LeaseRecord;
  }

  /**
   * Find lease by ID
   */
  async findById(id: string): Promise<LeaseRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(leases)
      .where(eq(leases.id, id))
      .limit(1);

    return (result[0] as LeaseRecord) || null;
  }

  /**
   * Find all leases for an organization
   */
  async findAll(organizationId: string): Promise<LeaseRecord[]> {
    const db = this.databaseService.getDb();
    return db
      .select()
      .from(leases)
      .where(eq(leases.organizationId, organizationId));
  }

  /**
   * Find leases by status
   */
  async findByStatus(
    organizationId: string,
    status: string,
  ): Promise<LeaseRecord[]> {
    const db = this.databaseService.getDb();
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
   * Find expiring leases within specified days
   */
  async findExpiring(
    organizationId: string,
    days: number,
  ): Promise<LeaseRecord[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();

    const db = this.databaseService.getDb();
    return db
      .select()
      .from(leases)
      .where(
        and(
          eq(leases.organizationId, organizationId),
          lte(leases.expirationDate, this.dateToString(futureDate)),
          gte(leases.expirationDate, this.dateToString(today)),
        ),
      );
  }

  /**
   * Convert Date to string format expected by Drizzle date fields
   */
  private dateToString(date: Date | undefined): string {
    if (!date) {
      throw new Error('Date is required');
    }
    const dateString = date.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Failed to convert date to string');
    }
    return dateString;
  }

  /**
   * Update lease
   */
  async update(id: string, data: UpdateLeaseDto): Promise<LeaseRecord | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const db = this.databaseService.getDb();
    const result = await db
      .update(leases)
      .set(updateData)
      .where(eq(leases.id, id))
      .returning();

    return (result[0] as LeaseRecord) || null;
  }

  /**
   * Delete lease
   */
  async delete(id: string): Promise<boolean> {
    const db = this.databaseService.getDb();
    const result = await db.delete(leases).where(eq(leases.id, id)).returning();

    return result.length > 0;
  }
}
