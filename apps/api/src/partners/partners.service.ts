import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import type { PartnersRepository } from './domain/partners.repository';

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CreatePartnerDto {
  partnerName: string;
  partnerCode: string;
  taxId?: string;
  billingAddress?: AddressDto;
  remitAddress?: AddressDto;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface UpdatePartnerDto {
  partnerName?: string;
  partnerCode?: string;
  taxId?: string;
  billingAddress?: AddressDto;
  remitAddress?: AddressDto;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

@Injectable()
export class PartnersService {
  constructor(
    @Inject('PartnersRepository')
    private readonly partnersRepository: PartnersRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async createPartner(dto: CreatePartnerDto) {
    const organizationId = this.tenantContextService.getOrganizationId();

    try {
      const newPartner = await this.partnersRepository.create({
        ...dto,
        organizationId,
      });

      if (!newPartner) {
        throw new Error('Failed to create partner');
      }

      return newPartner;
    } catch (error) {
      console.error('Error creating partner:', error);
      throw new Error('Failed to create partner');
    }
  }

  async getPartnerById(id: string) {
    const organizationId = this.tenantContextService.getOrganizationId();

    const partner = await this.partnersRepository.findById(id, organizationId);

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return partner;
  }

  async getPartners() {
    const organizationId = this.tenantContextService.getOrganizationId();
    return this.partnersRepository.findAll(organizationId);
  }

  async updatePartner(id: string, dto: UpdatePartnerDto) {
    // Validate partner exists and belongs to organization
    await this.getPartnerById(id);

    const organizationId = this.tenantContextService.getOrganizationId();

    try {
      const updatedPartner = await this.partnersRepository.update(
        id,
        dto,
        organizationId,
      );

      if (!updatedPartner) {
        throw new Error('Failed to update partner');
      }

      return updatedPartner;
    } catch (error) {
      console.error('Error updating partner:', error);
      throw new Error('Failed to update partner');
    }
  }

  async deletePartner(id: string) {
    // Validate partner exists and belongs to organization
    await this.getPartnerById(id);

    const organizationId = this.tenantContextService.getOrganizationId();
    const deleted = await this.partnersRepository.delete(id, organizationId);

    if (!deleted) {
      throw new Error('Failed to delete partner');
    }

    return { success: true };
  }
}
