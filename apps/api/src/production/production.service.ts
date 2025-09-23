import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { productionRecords } from '../database/schemas/production-records';
import { TenantContextService } from '../common/tenant/tenant-context.service';

export interface CreateProductionRecordDto {
  wellId: string;
  productionDate: string;
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  notes?: string;
}

export interface UpdateProductionRecordDto {
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  notes?: string;
}

@Injectable()
export class ProductionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new production record
   */
  async createProductionRecord(dto: CreateProductionRecordDto) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [newRecord] = await db
      .insert(productionRecords)
      .values({
        ...dto,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newRecord) {
      throw new Error('Failed to create production record');
    }

    return newRecord;
  }

  /**
   * Get production record by ID
   */
  async getProductionRecordById(id: string) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    const [record] = await db
      .select()
      .from(productionRecords)
      .where(
        and(
          eq(productionRecords.id, id),
          eq(productionRecords.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!record) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Get production records for a well
   */
  async getProductionRecordsByWell(wellId: string) {
    const db = this.databaseService.getDb();
    const organizationId = this.tenantContextService.getOrganizationId();

    return db
      .select()
      .from(productionRecords)
      .where(
        and(
          eq(productionRecords.wellId, wellId),
          eq(productionRecords.organizationId, organizationId),
        ),
      )
      .orderBy(desc(productionRecords.productionDate));
  }

  /**
   * Update production record
   */
  async updateProductionRecord(id: string, dto: UpdateProductionRecordDto) {
    await this.getProductionRecordById(id);

    const db = this.databaseService.getDb();
    const updateData = {
      ...dto,
      updatedAt: new Date(),
    };

    const [updatedRecord] = await db
      .update(productionRecords)
      .set(updateData)
      .where(eq(productionRecords.id, id))
      .returning();

    if (!updatedRecord) {
      throw new Error('Failed to update production record');
    }

    return updatedRecord;
  }

  /**
   * Delete production record
   */
  async deleteProductionRecord(id: string) {
    await this.getProductionRecordById(id);

    const db = this.databaseService.getDb();
    const [deletedRecord] = await db
      .delete(productionRecords)
      .where(eq(productionRecords.id, id))
      .returning();

    if (!deletedRecord) {
      throw new Error('Failed to delete production record');
    }

    return deletedRecord;
  }
}
