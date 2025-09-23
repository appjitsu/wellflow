import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { ProductionRepository } from '../domain/repositories/production.repository.interface';
import { TenantContextService } from '../common/tenant/tenant-context.service';

export interface CreateProductionRecordDto {
  wellId: string;
  productionDate: string;
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  oilPrice?: string;
  gasPrice?: string;
  runTicket?: string;
  comments?: string;
}

export interface UpdateProductionRecordDto {
  oilVolume?: string;
  gasVolume?: string;
  waterVolume?: string;
  oilPrice?: string;
  gasPrice?: string;
  runTicket?: string;
  comments?: string;
}

@Injectable()
export class ProductionService {
  constructor(
    @Inject('ProductionRepository')
    private readonly productionRepository: ProductionRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Create a new production record
   */
  async createProductionRecord(dto: CreateProductionRecordDto) {
    const organizationId = this.tenantContextService.getOrganizationId();

    return await this.productionRepository.create({
      ...dto,
      organizationId,
    });
  }

  /**
   * Get production record by ID
   */
  async getProductionRecordById(id: string) {
    const record = await this.productionRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Production record with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Get production records for a well
   */
  async getProductionRecordsByWell(wellId: string) {
    return this.productionRepository.findByWellId(wellId);
  }

  /**
   * Update production record
   */
  async updateProductionRecord(id: string, dto: UpdateProductionRecordDto) {
    await this.getProductionRecordById(id);

    const updatedRecord = await this.productionRepository.update(id, dto);

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

    const deleted = await this.productionRepository.delete(id);

    if (!deleted) {
      throw new Error('Failed to delete production record');
    }

    return { success: true };
  }
}
