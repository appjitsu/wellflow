import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { z } from 'zod';
import { Throttle } from '@nestjs/throttler';
import { LeasesService } from './leases.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreateLease,
  CanReadLease,
  CanUpdateLease,
  CanDeleteLease,
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
const createLeaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  leaseNumber: z.string().optional(),
  lessor: z.string().min(1, 'Lessor is required'),
  lessee: z.string().min(1, 'Lessee is required'),
  acreage: z.string().optional(),
  royaltyRate: z.string().optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  legalDescription: z.string().optional(),
});

const updateLeaseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  leaseNumber: z.string().optional(),
  lessor: z.string().min(1).optional(),
  lessee: z.string().min(1).optional(),
  acreage: z.string().optional(),
  royaltyRate: z.string().optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  status: z.string().optional(),
  legalDescription: z.string().optional(),
});

type CreateLeaseDto = z.infer<typeof createLeaseSchema>;
type UpdateLeaseDto = z.infer<typeof updateLeaseSchema>;

@Controller('leases')
@UseGuards(TenantGuard, AbilitiesGuard)
@ApiTags('Leases')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class LeasesController {
  constructor(
    private readonly leasesService: LeasesService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @CanCreateLease()
  @AuditLog({ action: 'create', resource: 'lease' })
  @ApiOperation({ summary: 'Create a new lease' })
  @ApiResponse({
    status: 201,
    description: 'Lease created successfully',
  })
  @ApiResponse({ status: 400, description: API_RESPONSES.INVALID_INPUT })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'lessor', 'lessee'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        leaseNumber: { type: 'string' },
        lessor: { type: 'string', minLength: 1 },
        lessee: { type: 'string', minLength: 1 },
        acreage: { type: 'string' },
        royaltyRate: { type: 'string' },
        effectiveDate: { type: 'string' },
        expirationDate: { type: 'string' },
        legalDescription: { type: 'string' },
      },
    },
  })
  async createLease(@Body() dto: CreateLeaseDto) {
    const validatedDto = this.validationService.validate(
      createLeaseSchema,
      dto,
    );
    return this.leasesService.createLease(validatedDto);
  }

  @Get()
  @CanReadLease()
  @AuditLog({ action: 'read', resource: 'lease' })
  @ApiOperation({ summary: 'Get all leases or filter by status' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter leases by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Leases retrieved successfully',
  })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getLeases(@Query('status') status?: string) {
    if (status) {
      return this.leasesService.getLeasesByStatus(status);
    }
    return this.leasesService.getLeases();
  }

  @Get('expiring')
  @CanReadLease()
  @AuditLog({ action: 'read', resource: 'lease' })
  @ApiOperation({ summary: 'Get leases expiring within specified days' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to look ahead (default: 30)',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Expiring leases retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid days parameter' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getExpiringLeases(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.leasesService.getExpiringLeases(daysNum);
  }

  @Get(':id')
  @CanReadLease()
  @AuditLog({ action: 'read', resource: 'lease' })
  @ApiOperation({ summary: 'Get lease by ID' })
  @ApiParam({ name: 'id', description: 'Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Lease retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid lease ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getLeaseById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.leasesService.getLeaseById(validatedId);
  }

  @Put(':id')
  @CanUpdateLease()
  @AuditLog({ action: 'update', resource: 'lease' })
  @ApiOperation({ summary: 'Update lease by ID' })
  @ApiParam({ name: 'id', description: 'Lease ID' })
  @ApiResponse({
    status: 200,
    description: 'Lease updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or lease ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        leaseNumber: { type: 'string' },
        lessor: { type: 'string', minLength: 1 },
        lessee: { type: 'string', minLength: 1 },
        acreage: { type: 'string' },
        royaltyRate: { type: 'string' },
        effectiveDate: { type: 'string' },
        expirationDate: { type: 'string' },
        status: { type: 'string' },
        legalDescription: { type: 'string' },
      },
    },
  })
  async updateLease(@Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    const validatedDto = this.validationService.validate(
      updateLeaseSchema,
      dto,
    );
    return this.leasesService.updateLease(validatedId, validatedDto);
  }

  @Delete(':id')
  @CanDeleteLease()
  @AuditLog({ action: 'delete', resource: 'lease' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lease by ID' })
  @ApiParam({ name: 'id', description: 'Lease ID' })
  @ApiResponse({
    status: 204,
    description: 'Lease deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid lease ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Lease not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async deleteLease(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.leasesService.deleteLease(validatedId);
  }
}
