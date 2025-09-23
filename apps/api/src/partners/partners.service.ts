import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { partners } from '../database/schemas/partners';
import { TenantContextService } from '../common/tenant/tenant-context.service';

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
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async createPartner(dto: CreatePartnerDto) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [newPartner] = await db
      .insert(partners)
      .values({
        ...dto,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newPartner) {
      throw new Error('Failed to create partner');
    }

    return newPartner;
  }

  async getPartnerById(id: string) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [partner] = await db
      .select()
      .from(partners)
      .where(
        and(eq(partners.id, id), eq(partners.organizationId, organizationId)),
      )
      .limit(1);

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return partner;
  }

  async getPartners() {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    return db
      .select()
      .from(partners)
      .where(eq(partners.organizationId, organizationId));
  }

  async updatePartner(id: string, dto: UpdatePartnerDto) {
    await this.getPartnerById(id);

    const db = this.databaseService.getDb();
    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    const [updatedPartner] = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();

    if (!updatedPartner) {
      throw new Error('Failed to update partner');
    }

    return updatedPartner;
  }

  async deletePartner(id: string) {
    await this.getPartnerById(id);

    const db = this.databaseService.getDb();
    const [deletedPartner] = await db
      .delete(partners)
      .where(eq(partners.id, id))
      .returning();

    if (!deletedPartner) {
      throw new Error('Failed to delete partner');
    }

    return deletedPartner;
  }
}
