import { CreatePartnerDto, UpdatePartnerDto } from '../partners.service';

export interface PartnerRecord {
  id: string;
  organizationId: string;
  partnerName: string;
  partnerCode: string;
  taxId: string | null;
  billingAddress: Record<string, unknown> | null; // JSONB
  remitAddress: Record<string, unknown> | null; // JSONB
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnersRepository {
  create(
    data: CreatePartnerDto & { organizationId: string },
  ): Promise<PartnerRecord>;
  findById(id: string, organizationId: string): Promise<PartnerRecord | null>;
  findAll(organizationId: string): Promise<PartnerRecord[]>;
  update(
    id: string,
    data: UpdatePartnerDto,
    organizationId: string,
  ): Promise<PartnerRecord | null>;
  delete(id: string, organizationId: string): Promise<boolean>;
}
