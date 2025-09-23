import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LeaseRepository } from '../domain/repositories/lease.repository.interface';
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
    @Inject('LeaseRepository')
    private readonly leaseRepository: LeaseRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new lease
   */
  async createLease(dto: CreateLeaseDto) {
    const organizationId = this.tenantContextService.getOrganizationId();

    return await this.leaseRepository.create({
      ...dto,
      organizationId,
    });
  }

  /**
   * Get lease by ID with tenant validation
   */
  async getLeaseById(id: string) {
    const lease = await this.leaseRepository.findById(id);

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    // Validate that the lease belongs to the current organization
    const organizationId = this.tenantContextService.getOrganizationId();
    if (lease.organizationId !== organizationId) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  /**
   * Get all leases for current organization
   */
  async getLeases() {
    const organizationId = this.tenantContextService.getOrganizationId();
    return this.leaseRepository.findAll(organizationId);
  }

  /**
   * Update lease
   */
  async updateLease(id: string, dto: UpdateLeaseDto) {
    // Validate lease exists and belongs to organization
    await this.getLeaseById(id);

    const updatedLease = await this.leaseRepository.update(id, dto);

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

    const deleted = await this.leaseRepository.delete(id);

    if (!deleted) {
      throw new Error('Failed to delete lease');
    }

    return { success: true };
  }

  /**
   * Get leases by status
   */
  async getLeasesByStatus(status: string) {
    const organizationId = this.tenantContextService.getOrganizationId();
    return this.leaseRepository.findByStatus(organizationId, status);
  }

  /**
   * Get expiring leases
   */
  async getExpiringLeases(days: number = 30) {
    const organizationId = this.tenantContextService.getOrganizationId();
    return this.leaseRepository.findExpiring(organizationId, days);
  }
}
