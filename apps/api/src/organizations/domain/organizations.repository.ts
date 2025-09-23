import type { organizations } from '../../database/schemas/organizations';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../organizations.service';

export type OrganizationRecord = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export interface OrganizationsRepository {
  create(dto: CreateOrganizationDto): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationRecord | null>;
  delete(id: string): Promise<OrganizationRecord | null>;
}
