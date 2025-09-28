import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { organizations } from '../../database/schemas/organizations';
import { DatabaseService } from '../../database/database.service';
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
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationRecord> {
    const db = this.databaseService.getDb();
    const result = await db
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
    const db = this.databaseService.getDb();
    const result = await db
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

    const db = this.databaseService.getDb();
    const result = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    return (result[0] as OrganizationRecord) || null;
  }

  async delete(id: string): Promise<OrganizationRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    return (result[0] as OrganizationRecord) || null;
  }
}
