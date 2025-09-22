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
import { OrganizationsService } from './organizations.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { ValidationService } from '../common/validation/validation.service';

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
@UseGuards(TenantGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    const validatedDto = this.validationService.validate(
      createOrganizationSchema,
      dto,
    );
    return this.organizationsService.createOrganization(validatedDto);
  }

  @Get('current')
  async getCurrentOrganization() {
    return this.organizationsService.getCurrentOrganization();
  }

  @Get(':id')
  async getOrganizationById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.getOrganizationById(validatedId);
  }

  @Put(':id')
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
  async deleteOrganization(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.deleteOrganization(validatedId);
  }

  @Get(':id/stats')
  async getOrganizationStats(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.organizationsService.getOrganizationStats(validatedId);
  }
}
