import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import type { OrganizationsRepository } from './domain/organizations.repository';

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
    @Inject('OrganizationsRepository')
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new organization
   */
  async createOrganization(dto: CreateOrganizationDto) {
    // Note: In a real implementation, this would be called by a super-admin
    // For now, we'll allow creation but this should be restricted
    const newOrg = await this.organizationsRepository.create(dto);

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

    const organization = await this.organizationsRepository.findById(id);

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

    const updatedOrg = await this.organizationsRepository.update(id, dto);

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

    const deletedOrg = await this.organizationsRepository.delete(id);

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
