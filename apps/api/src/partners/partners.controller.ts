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
import { PartnersService } from './partners.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreatePartner,
  CanReadPartner,
  CanUpdatePartner,
  CanDeletePartner,
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
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().optional(),
});

const createPartnerSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required').max(255),
  partnerCode: z.string().min(1, 'Partner code is required').max(50),
  taxId: z.string().optional(),
  billingAddress: addressSchema.optional(),
  remitAddress: addressSchema.optional(),
  contactEmail: z.string().min(1).optional(),
  contactPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updatePartnerSchema = z.object({
  partnerName: z.string().min(1).max(255).optional(),
  partnerCode: z.string().min(1).max(50).optional(),
  taxId: z.string().optional(),
  billingAddress: addressSchema.optional(),
  remitAddress: addressSchema.optional(),
  contactEmail: z.string().min(1).optional(),
  contactPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CreatePartnerDto = z.infer<typeof createPartnerSchema>;
type UpdatePartnerDto = z.infer<typeof updatePartnerSchema>;

@ApiTags('partners')
@Controller('partners')
@UseGuards(TenantGuard, AbilitiesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @CanCreatePartner()
  @AuditLog({ action: 'create', resource: 'partner' })
  @ApiOperation({ summary: 'Create a new partner' })
  @ApiResponse({
    status: 201,
    description: 'Partner created successfully',
  })
  @ApiResponse({ status: 400, description: API_RESPONSES.INVALID_INPUT })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['partnerName', 'partnerCode'],
      properties: {
        partnerName: { type: 'string', minLength: 1, maxLength: 255 },
        partnerCode: { type: 'string', minLength: 1, maxLength: 50 },
        taxId: { type: 'string' },
        billingAddress: {
          type: 'object',
          properties: {
            street: { type: 'string', minLength: 1 },
            city: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            zipCode: { type: 'string', minLength: 1 },
            country: { type: 'string' },
          },
        },
        remitAddress: {
          type: 'object',
          properties: {
            street: { type: 'string', minLength: 1 },
            city: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            zipCode: { type: 'string', minLength: 1 },
            country: { type: 'string' },
          },
        },
        contactEmail: { type: 'string', minLength: 1 },
        contactPhone: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  async createPartner(@Body() dto: CreatePartnerDto) {
    const validatedDto = this.validationService.validate(
      createPartnerSchema,
      dto,
    );
    return this.partnersService.createPartner(validatedDto);
  }

  @Get(':id')
  @CanReadPartner()
  @AuditLog({ action: 'read', resource: 'partner' })
  @ApiOperation({ summary: 'Get partner by ID' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid partner ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getPartnerById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.partnersService.getPartnerById(validatedId);
  }

  @Get()
  @CanReadPartner()
  @AuditLog({ action: 'read', resource: 'partner' })
  @ApiOperation({ summary: 'Get all partners for the organization' })
  @ApiResponse({
    status: 200,
    description: 'Partners retrieved successfully',
  })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getPartners() {
    return this.partnersService.getPartners();
  }

  @Put(':id')
  @CanUpdatePartner()
  @AuditLog({ action: 'update', resource: 'partner' })
  @ApiOperation({ summary: 'Update partner by ID' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or partner ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        partnerName: { type: 'string', minLength: 1, maxLength: 255 },
        partnerCode: { type: 'string', minLength: 1, maxLength: 50 },
        taxId: { type: 'string' },
        billingAddress: {
          type: 'object',
          properties: {
            street: { type: 'string', minLength: 1 },
            city: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            zipCode: { type: 'string', minLength: 1 },
            country: { type: 'string' },
          },
        },
        remitAddress: {
          type: 'object',
          properties: {
            street: { type: 'string', minLength: 1 },
            city: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            zipCode: { type: 'string', minLength: 1 },
            country: { type: 'string' },
          },
        },
        contactEmail: { type: 'string', minLength: 1 },
        contactPhone: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  async updatePartner(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    const validatedDto = this.validationService.validate(
      updatePartnerSchema,
      dto,
    );

    return this.partnersService.updatePartner(validatedId, validatedDto);
  }

  @Delete(':id')
  @CanDeletePartner()
  @AuditLog({ action: 'delete', resource: 'partner' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete partner by ID' })
  @ApiParam({ name: 'id', description: 'Partner ID' })
  @ApiResponse({
    status: 204,
    description: 'Partner deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid partner ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async deletePartner(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.partnersService.deletePartner(validatedId);
  }
}
