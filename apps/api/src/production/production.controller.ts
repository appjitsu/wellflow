import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ProductionService } from './production.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { ValidationService } from '../common/validation/validation.service';

// Zod schemas for validation
const createProductionRecordSchema = z.object({
  wellId: z.string().uuid('Invalid well ID'),
  productionDate: z.string(),
  oilVolume: z.string().optional(),
  gasVolume: z.string().optional(),
  waterVolume: z.string().optional(),
  notes: z.string().optional(),
});

const updateProductionRecordSchema = z.object({
  oilVolume: z.string().optional(),
  gasVolume: z.string().optional(),
  waterVolume: z.string().optional(),
  notes: z.string().optional(),
});

type CreateProductionRecordDto = z.infer<typeof createProductionRecordSchema>;
type UpdateProductionRecordDto = z.infer<typeof updateProductionRecordSchema>;

@Controller('production')
@UseGuards(TenantGuard)
export class ProductionController {
  constructor(
    private readonly productionService: ProductionService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  async createProductionRecord(@Body() dto: CreateProductionRecordDto) {
    const validatedDto = this.validationService.validate(
      createProductionRecordSchema,
      dto,
    );
    return this.productionService.createProductionRecord(validatedDto);
  }

  @Get('well/:wellId')
  async getProductionRecordsByWell(@Param('wellId') wellId: string) {
    const validatedWellId = this.validationService.validate(
      this.validationService.schemas.id,
      wellId,
    );
    return this.productionService.getProductionRecordsByWell(validatedWellId);
  }

  @Get(':id')
  async getProductionRecordById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.productionService.getProductionRecordById(validatedId);
  }

  @Put(':id')
  async updateProductionRecord(
    @Param('id') id: string,
    @Body() dto: UpdateProductionRecordDto,
  ) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    const validatedDto = this.validationService.validate(
      updateProductionRecordSchema,
      dto,
    );
    return this.productionService.updateProductionRecord(
      validatedId,
      validatedDto,
    );
  }

  @Delete(':id')
  async deleteProductionRecord(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.productionService.deleteProductionRecord(validatedId);
  }
}
