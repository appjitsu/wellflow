import { Injectable, Inject } from '@nestjs/common';
import { eq, ilike, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './base.repository';
import { AuditResourceType } from '../../domain/entities/audit-log.entity';
import { organizations } from '../../database/schema';
import * as schema from '../../database/schema';

/**
 * Organization Repository Implementation
 * Handles organization data access with multi-tenant support
 */
@Injectable()
export class OrganizationRepository extends BaseRepository<
  typeof organizations
> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    db: NodePgDatabase<typeof schema>,
  ) {
    super(db, organizations);
  }

  protected getResourceType(): AuditResourceType {
    return AuditResourceType.ORGANIZATION;
  }

  /**
   * Find organization by name (case-insensitive)
   */
  async findByName(
    name: string,
  ): Promise<typeof organizations.$inferSelect | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(ilike(organizations.name, `%${name}%`))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find organization by tax ID
   */
  async findByTaxId(
    taxId: string,
  ): Promise<typeof organizations.$inferSelect | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.taxId, taxId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find organization by email
   */
  async findByEmail(
    email: string,
  ): Promise<typeof organizations.$inferSelect | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.email, email))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Search organizations by name or email
   */
  async search(query: string): Promise<(typeof organizations.$inferSelect)[]> {
    return this.db
      .select()
      .from(organizations)
      .where(
        and(
          ilike(organizations.name, `%${query}%`),
          ilike(organizations.email, `%${query}%`),
        ),
      );
  }

  /**
   * Update organization settings
   */
  async updateSettings(
    id: string,
    settings: Record<string, unknown>,
  ): Promise<typeof organizations.$inferSelect | null> {
    const result = await this.db
      .update(organizations)
      .set({
        settings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Get organization statistics
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getStatistics(_organizationId: string): Promise<{
    totalUsers: number;
    totalWells: number;
    totalLeases: number;
    totalProduction: number;
  }> {
    // This would typically join with other tables
    // For now, returning placeholder structure
    return {
      totalUsers: 0,
      totalWells: 0,
      totalLeases: 0,
      totalProduction: 0,
    };
  }
}
