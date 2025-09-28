import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { partners } from '../../database/schemas/partners';
import type {
  PartnersRepository,
  PartnerRecord,
} from '../domain/partners.repository';
import type { CreatePartnerDto, UpdatePartnerDto } from '../partners.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PartnersRepositoryImpl implements PartnersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    data: CreatePartnerDto & { organizationId: string },
  ): Promise<PartnerRecord> {
    const db = this.databaseService.getDb();
    const result = await db
      .insert(partners)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] as PartnerRecord;
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<PartnerRecord | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(partners)
      .where(
        and(eq(partners.id, id), eq(partners.organizationId, organizationId)),
      )
      .limit(1);

    return (result[0] as PartnerRecord) || null;
  }

  async findAll(organizationId: string): Promise<PartnerRecord[]> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(partners)
      .where(eq(partners.organizationId, organizationId));

    return result as PartnerRecord[];
  }

  async update(
    id: string,
    data: UpdatePartnerDto,
    organizationId: string,
  ): Promise<PartnerRecord | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const db = this.databaseService.getDb();
    const result = await db
      .update(partners)
      .set(updateData)
      .where(
        and(eq(partners.id, id), eq(partners.organizationId, organizationId)),
      )
      .returning();

    return (result[0] as PartnerRecord) || null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const db = this.databaseService.getDb();
    const result = await db
      .delete(partners)
      .where(
        and(eq(partners.id, id), eq(partners.organizationId, organizationId)),
      )
      .returning({
        id: partners.id,
      });

    return result.length > 0;
  }
}
