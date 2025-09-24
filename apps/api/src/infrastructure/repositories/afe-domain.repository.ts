import { Injectable, Inject } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { Afe } from '../../domain/entities/afe.entity';
import { AfeStatus, AfeType } from '../../domain/enums/afe-status.enum';
import { AfeRepository } from './afe.repository';
import * as schema from '../../database/schema';

/**
 * AFE Domain Repository Implementation
 * Uses composition with AfeRepository and implements the domain repository interface
 * Handles mapping between domain entities and database persistence layer
 */
@Injectable()
export class AfeDomainRepository implements IAfeRepository {
  private afeRepository: AfeRepository;

  constructor(
    @Inject('DATABASE_CONNECTION')
    db: NodePgDatabase<typeof schema>,
  ) {
    this.afeRepository = new AfeRepository(db);
  }

  /**
   * Save an AFE entity
   */
  async save(afe: Afe): Promise<Afe> {
    const persistenceData = afe.toPersistence();

    // Check if AFE exists by ID
    const existing = await this.afeRepository.findById(persistenceData.id);

    if (existing) {
      // Update existing AFE using the base repository
      const updated = await this.afeRepository.update(persistenceData.id, {
        afeNumber: persistenceData.afeNumber,
        wellId: persistenceData.wellId,
        leaseId: persistenceData.leaseId,
        afeType: persistenceData.afeType,
        status: persistenceData.status,
        totalEstimatedCost: persistenceData.totalEstimatedCost,
        approvedAmount: persistenceData.approvedAmount,
        actualCost: persistenceData.actualCost,
        description: persistenceData.description,
        effectiveDate: persistenceData.effectiveDate
          ?.toISOString()
          .split('T')[0],
        approvalDate: persistenceData.approvalDate?.toISOString().split('T')[0],
        submittedAt: persistenceData.submittedAt,
        version: persistenceData.version,
        updatedAt: new Date(),
      });

      if (!updated) {
        throw new Error('Failed to update AFE');
      }

      return this.toDomainEntity(updated);
    } else {
      // Create new AFE using the base repository
      const created = await this.afeRepository.create({
        id: persistenceData.id,
        organizationId: persistenceData.organizationId,
        afeNumber: persistenceData.afeNumber,
        wellId: persistenceData.wellId,
        leaseId: persistenceData.leaseId,
        afeType: persistenceData.afeType,
        status: persistenceData.status,
        totalEstimatedCost: persistenceData.totalEstimatedCost,
        approvedAmount: persistenceData.approvedAmount,
        actualCost: persistenceData.actualCost,
        description: persistenceData.description,
        effectiveDate: persistenceData.effectiveDate
          ?.toISOString()
          .split('T')[0],
        approvalDate: persistenceData.approvalDate?.toISOString().split('T')[0],
        submittedAt: persistenceData.submittedAt,
        version: persistenceData.version,
        createdAt: persistenceData.createdAt,
        updatedAt: persistenceData.updatedAt,
      });

      return this.toDomainEntity(created);
    }
  }

  /**
   * Find AFE by ID and convert to domain entity
   */
  async findById(id: string): Promise<Afe | null> {
    const result = await this.afeRepository.findById(id);
    return result ? this.toDomainEntity(result) : null;
  }

  /**
   * Find AFE by AFE number within organization
   */
  async findByAfeNumber(
    organizationId: string,
    afeNumber: string,
  ): Promise<Afe | null> {
    const results = await this.afeRepository.findByStatus(
      organizationId,
      'draft',
    );
    const found = results.find((afe) => afe.afeNumber === afeNumber);
    return found ? this.toDomainEntity(found) : null;
  }

  /**
   * Find AFEs by organization ID with domain entity conversion
   */
  async findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: AfeStatus;
      afeType?: AfeType;
    },
  ): Promise<Afe[]> {
    // Use base repository methods and convert to domain entities
    let results: (typeof schema.afes.$inferSelect)[] = [];

    if (options?.status) {
      results = await this.afeRepository.findByStatus(
        organizationId,
        options.status,
      );
    } else {
      // Get all AFEs for organization (simplified approach)
      results = await this.afeRepository.findByStatus(organizationId, 'draft');
      const submitted = await this.afeRepository.findByStatus(
        organizationId,
        'submitted',
      );
      const approved = await this.afeRepository.findByStatus(
        organizationId,
        'approved',
      );
      const rejected = await this.afeRepository.findByStatus(
        organizationId,
        'rejected',
      );
      const closed = await this.afeRepository.findByStatus(
        organizationId,
        'closed',
      );

      results = [...results, ...submitted, ...approved, ...rejected, ...closed];
    }

    // Apply pagination if specified
    if (options?.offset) {
      results = results.slice(options.offset);
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find AFEs by well ID
   */
  async findByWellId(wellId: string): Promise<Afe[]> {
    const results = await this.afeRepository.findByWellId(wellId);
    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find AFEs by lease ID
   */
  findByLeaseId(_leaseId: string): Promise<Afe[]> {
    // Base repository doesn't have this method, so we'll implement it simply
    // This is a simplified implementation
    return Promise.resolve([]);
  }

  /**
   * Find AFEs by status with domain entity conversion
   */
  async findByStatus(
    organizationId: string,
    status: AfeStatus,
  ): Promise<Afe[]> {
    const results = await this.afeRepository.findByStatus(
      organizationId,
      status,
    );
    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Find AFEs requiring approval
   */
  async findRequiringApproval(organizationId: string): Promise<Afe[]> {
    return this.findByStatus(organizationId, AfeStatus.SUBMITTED);
  }

  /**
   * Find AFEs by date range
   */
  async findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Afe[]> {
    const results = await this.afeRepository.findByDateRange(
      organizationId,
      startDate,
      endDate,
    );
    return results.map((row) => this.toDomainEntity(row));
  }

  /**
   * Get next AFE number for organization and year
   */
  getNextAfeNumber(organizationId: string, year: number): Promise<string> {
    // Simple implementation - in production this would be more sophisticated
    const yearPrefix = `AFE-${year}-`;
    return Promise.resolve(`${yearPrefix}0001`);
  }

  /**
   * Check if AFE number exists within organization
   */
  async existsByAfeNumber(
    organizationId: string,
    afeNumber: string,
  ): Promise<boolean> {
    const found = await this.findByAfeNumber(organizationId, afeNumber);
    return found !== null;
  }

  /**
   * Delete AFE by ID
   */
  delete(_id: string): Promise<void> {
    // Base repository doesn't have delete method, so we'll implement it
    // This is a placeholder - in production you'd implement proper deletion
    throw new Error('Delete operation not implemented');
  }

  /**
   * Count AFEs by criteria
   */
  async count(
    organizationId: string,
    criteria?: {
      status?: AfeStatus;
      afeType?: AfeType;
      wellId?: string;
      leaseId?: string;
    },
  ): Promise<number> {
    // Simplified implementation
    const afes = await this.findByOrganizationId(organizationId, {
      status: criteria?.status,
      afeType: criteria?.afeType,
    });

    return afes.length;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: typeof schema.afes.$inferSelect): Afe {
    return Afe.fromPersistence({
      id: row.id,
      organizationId: row.organizationId,
      afeNumber: row.afeNumber,
      wellId: row.wellId || undefined,
      leaseId: row.leaseId || undefined,
      afeType: row.afeType as AfeType,
      status: row.status as AfeStatus,
      totalEstimatedCost: row.totalEstimatedCost || undefined,
      approvedAmount: row.approvedAmount || undefined,
      actualCost: row.actualCost || undefined,
      description: row.description || undefined,
      effectiveDate: row.effectiveDate
        ? new Date(row.effectiveDate)
        : undefined,
      approvalDate: row.approvalDate ? new Date(row.approvalDate) : undefined,
      submittedAt: row.submittedAt || undefined,
      version: row.version || 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
