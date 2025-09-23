import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { organizations } from '../../database/schemas/organizations';
import type {
  OrganizationsRepository,
  OrganizationRecord,
} from '../domain/organizations.repository';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../organizations.service';

@Injectable()
export class OrganizationsRepositoryImpl implements OrganizationsRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationRecord> {
    const result = await this.db
      .insert(organizations)
      .values({
        name: dto.name,
        email: dto.contactEmail,
        phone: dto.contactPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] as OrganizationRecord;
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return (result[0] as OrganizationRecord) || null;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationRecord | null> {
    const updateData: Partial<typeof organizations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.contactEmail !== undefined) updateData.email = dto.contactEmail;
    if (dto.contactPhone !== undefined) updateData.phone = dto.contactPhone;

    const result = await this.db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    return (result[0] as OrganizationRecord) || null;
  }

  async delete(id: string): Promise<OrganizationRecord | null> {
    const result = await this.db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    return (result[0] as OrganizationRecord) || null;
  }
}
