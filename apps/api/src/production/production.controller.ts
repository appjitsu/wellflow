import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { z } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { ProductionService } from './production.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreateProduction,
  CanReadProduction,
  CanUpdateProduction,
  CanDeleteProduction,
} from '../authorization/abilities.decorator';
import { AuditLog } from '../presentation/decorators/audit-log.decorator';
import { ValidationService } from '../common/validation/validation.service';

// Common API response descriptions
const API_RESPONSES: Record<string, string> = {
  INVALID_INPUT: 'Invalid input data',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  TOO_MANY_REQUESTS: 'Too many requests',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;

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
@UseGuards(TenantGuard, AbilitiesGuard)
@ApiTags('Production')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class ProductionController {
  constructor(
    private readonly productionService: ProductionService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @CanCreateProduction()
  @AuditLog({ action: 'create', resource: 'production' })
  @ApiOperation({ summary: 'Create a new production record' })
  @ApiResponse({
    status: 201,
    description: 'Production record created successfully',
  })
  @ApiResponse({ status: 400, description: API_RESPONSES.INVALID_INPUT })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['wellId', 'productionDate'],
      properties: {
        wellId: { type: 'string', format: 'uuid' },
        productionDate: { type: 'string' },
        oilVolume: { type: 'string' },
        gasVolume: { type: 'string' },
        waterVolume: { type: 'string' },
        notes: { type: 'string' },
      },
    },
  })
  async createProductionRecord(@Body() dto: CreateProductionRecordDto) {
    const validatedDto = this.validationService.validate(
      createProductionRecordSchema,
      dto,
    );
    return this.productionService.createProductionRecord(validatedDto);
  }

  @Get('well/:wellId')
  @CanReadProduction()
  @AuditLog({ action: 'read', resource: 'production' })
  @ApiOperation({ summary: 'Get production records by well ID' })
  @ApiParam({ name: 'wellId', description: 'Well ID' })
  @ApiResponse({
    status: 200,
    description: 'Production records retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid well ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Well not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getProductionRecordsByWell(@Param('wellId') wellId: string) {
    const validatedWellId = this.validationService.validate(
      this.validationService.schemas.id,
      wellId,
    );
    return this.productionService.getProductionRecordsByWell(validatedWellId);
  }

  @Get(':id')
  @CanReadProduction()
  @AuditLog({ action: 'read', resource: 'production' })
  @ApiOperation({ summary: 'Get production record by ID' })
  @ApiParam({ name: 'id', description: 'Production record ID' })
  @ApiResponse({
    status: 200,
    description: 'Production record retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid production record ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Production record not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getProductionRecordById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.productionService.getProductionRecordById(validatedId);
  }

  @Put(':id')
  @CanUpdateProduction()
  @AuditLog({ action: 'update', resource: 'production' })
  @ApiOperation({ summary: 'Update production record by ID' })
  @ApiParam({ name: 'id', description: 'Production record ID' })
  @ApiResponse({
    status: 200,
    description: 'Production record updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or production record ID',
  })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Production record not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oilVolume: { type: 'string' },
        gasVolume: { type: 'string' },
        waterVolume: { type: 'string' },
        notes: { type: 'string' },
      },
    },
  })
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
  @CanDeleteProduction()
  @AuditLog({ action: 'delete', resource: 'production' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete production record by ID' })
  @ApiParam({ name: 'id', description: 'Production record ID' })
  @ApiResponse({
    status: 204,
    description: 'Production record deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid production record ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Production record not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async deleteProductionRecord(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.productionService.deleteProductionRecord(validatedId);
  }
}
