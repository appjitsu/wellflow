import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { organizations } from '../database/schemas/organizations';
import { TenantContextService } from '../common/tenant/tenant-context.service';

export interface CreateOrganizationDto {
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new organization
   */
  async createOrganization(dto: CreateOrganizationDto) {
    // Note: In a real implementation, this would be called by a super-admin
    // For now, we'll allow creation but this should be restricted
    const db = this.databaseService.getDb();

    const [newOrg] = await db
      .insert(organizations)
      .values({
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newOrg) {
      throw new Error('Failed to create organization');
    }

    return newOrg;
  }

  /**
   * Get organization by ID with tenant validation
   */
  async getOrganizationById(id: string) {
    this.tenantContextService.validateOrganizationAccess(id);

    const db = this.databaseService.getDb();
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  /**
   * Get current user's organization
   */
  async getCurrentOrganization() {
    const organizationId = this.tenantContextService.getOrganizationId();
    return this.getOrganizationById(organizationId);
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    this.tenantContextService.validateOrganizationAccess(id);

    // Validate organization exists
    await this.getOrganizationById(id);

    const db = this.databaseService.getDb();
    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    if (!updatedOrg) {
      throw new Error('Failed to update organization');
    }

    return updatedOrg;
  }

  /**
   * Delete organization (admin only)
   */
  async deleteOrganization(id: string) {
    // This should only be allowed for super-admins
    // For now, we'll validate tenant access
    this.tenantContextService.validateOrganizationAccess(id);

    // Validate organization exists
    await this.getOrganizationById(id);

    const db = this.databaseService.getDb();
    const [deletedOrg] = await db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    if (!deletedOrg) {
      throw new Error('Failed to delete organization');
    }

    return deletedOrg;
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(id: string) {
    this.tenantContextService.validateOrganizationAccess(id);

    // This would aggregate data from various repositories
    // For now, return basic organization info
    const organization = await this.getOrganizationById(id);

    return {
      organization,
      stats: {
        totalWells: 0, // Would be calculated from wells repository
        totalUsers: 0, // Would be calculated from users repository
        totalProductionRecords: 0, // Would be calculated from production repository
      },
    };
  }
}
