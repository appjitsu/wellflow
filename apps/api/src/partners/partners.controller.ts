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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { ValidationService } from '../common/validation/validation.service';

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
@UseGuards(TenantGuard)
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner' })
  @ApiResponse({ status: 201, description: 'Partner created successfully' })
  async createPartner(@Body() dto: CreatePartnerDto) {
    const validatedDto = this.validationService.validate(
      createPartnerSchema,
      dto,
    );
    return this.partnersService.createPartner(validatedDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner retrieved successfully' })
  async getPartnerById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.partnersService.getPartnerById(validatedId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all partners for the organization' })
  @ApiResponse({ status: 200, description: 'Partners retrieved successfully' })
  async getPartners() {
    return this.partnersService.getPartners();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner updated successfully' })
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
  @ApiOperation({ summary: 'Delete partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner deleted successfully' })
  async deletePartner(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.partnersService.deletePartner(validatedId);
  }
}
