import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
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
import { OrganizationsService } from './organizations.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreateOrganization,
  CanReadOrganization,
  CanUpdateOrganization,
  CanDeleteOrganization,
} from '../authorization/abilities.decorator';
import { AuditLog } from '../presentation/decorators/audit-log.decorator';
import { ValidationService } from '../common/validation/validation.service';

// Common API response descriptions
const API_RESPONSES: Record<string, string> = {
  INVALID_INPUT: 'Invalid input data',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  TOO_MANY_REQUESTS: 'Too many requests',
  NOT_FOUND: 'Organization not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;

// Common parameter descriptions
// Common parameter descriptions
const PARAM_DESCRIPTIONS: Record<string, string> = {
  ORGANIZATION_ID: 'Organization ID',
} as const;

// Zod schemas for validation
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  contactPhone: z.string().optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  contactPhone: z.string().optional(),
});

type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

@Controller('organizations')
@UseGuards(TenantGuard, AbilitiesGuard)
@ApiTags('Organizations')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @CanCreateOrganization()
  @AuditLog({ action: 'create', resource: 'organization' })
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({ status: 400, description: API_RESPONSES.INVALID_INPUT })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        contactEmail: { type: 'string', format: 'email' },
        contactPhone: { type: 'string' },
      },
    },
  })
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    const validatedDto = this.validationService.validate(
      createOrganizationSchema,
      dto,
    );
    return this.organizationsService.createOrganization(validatedDto);
  }

  @Get('current')
  @CanReadOrganization()
  @AuditLog({ action: 'read', resource: 'organization' })
  @ApiOperation({ summary: 'Get current organization' })
  @ApiResponse({
    status: 200,
    description: 'Current organization retrieved successfully',
  })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: API_RESPONSES.NOT_FOUND })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getCurrentOrganization() {
    return this.organizationsService.getCurrentOrganization();
  }

  @Get(':id')
  @CanReadOrganization()
  @AuditLog({ action: 'read', resource: 'organization' })
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: PARAM_DESCRIPTIONS.ORGANIZATION_ID })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid organization ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: API_RESPONSES.NOT_FOUND })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getOrganizationById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.getOrganizationById(validatedId);
  }

  @Put(':id')
  @CanUpdateOrganization()
  @AuditLog({ action: 'update', resource: 'organization' })
  @ApiOperation({ summary: 'Update organization by ID' })
  @ApiParam({ name: 'id', description: PARAM_DESCRIPTIONS.ORGANIZATION_ID })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or organization ID',
  })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: API_RESPONSES.NOT_FOUND })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        contactEmail: { type: 'string', format: 'email' },
        contactPhone: { type: 'string' },
      },
    },
  })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    const validatedDto = this.validationService.validate(
      updateOrganizationSchema,
      dto,
    );
    return this.organizationsService.updateOrganization(
      validatedId,
      validatedDto,
    );
  }

  @Delete(':id')
  @CanDeleteOrganization()
  @AuditLog({ action: 'delete', resource: 'organization' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization by ID' })
  @ApiParam({ name: 'id', description: PARAM_DESCRIPTIONS.ORGANIZATION_ID })
  @ApiResponse({
    status: 204,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid organization ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: API_RESPONSES.NOT_FOUND })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async deleteOrganization(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.deleteOrganization(validatedId);
  }

  @Get(':id/stats')
  @CanReadOrganization()
  @AuditLog({ action: 'read', resource: 'organization' })
  @ApiOperation({ summary: 'Get organization statistics by ID' })
  @ApiParam({ name: 'id', description: PARAM_DESCRIPTIONS.ORGANIZATION_ID })
  @ApiResponse({
    status: 200,
    description: 'Organization statistics retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid organization ID' })
  @ApiResponse({ status: 401, description: API_RESPONSES.UNAUTHORIZED })
  @ApiResponse({ status: 403, description: API_RESPONSES.FORBIDDEN })
  @ApiResponse({ status: 404, description: API_RESPONSES.NOT_FOUND })
  @ApiResponse({ status: 429, description: API_RESPONSES.TOO_MANY_REQUESTS })
  async getOrganizationStats(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.getOrganizationStats(validatedId);
  }
}
