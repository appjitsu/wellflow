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
} from '@nestjs/common';
import { z } from 'zod';
import { LeasesService } from './leases.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { ValidationService } from '../common/validation/validation.service';

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
@UseGuards(TenantGuard)
export class LeasesController {
  constructor(
    private readonly leasesService: LeasesService,
    private readonly validationService: ValidationService,
  ) {}

  @Post()
  async createLease(@Body() dto: CreateLeaseDto) {
    const validatedDto = this.validationService.validate(
      createLeaseSchema,
      dto,
    );
    return this.leasesService.createLease(validatedDto);
  }

  @Get()
  async getLeases(@Query('status') status?: string) {
    if (status) {
      return this.leasesService.getLeasesByStatus(status);
    }
    return this.leasesService.getLeases();
  }

  @Get('expiring')
  async getExpiringLeases(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.leasesService.getExpiringLeases(daysNum);
  }

  @Get(':id')
  async getLeaseById(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.leasesService.getLeaseById(validatedId);
  }

  @Put(':id')
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
  async deleteLease(@Param('id') id: string) {
    const validatedId = this.validationService.validate(
      this.validationService.schemas.id,
      id,
    );
    return this.leasesService.deleteLease(validatedId);
  }
}
