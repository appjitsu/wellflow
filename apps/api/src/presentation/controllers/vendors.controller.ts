import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { CreateVendorCommand } from '../../application/commands/create-vendor.command';
import { UpdateVendorStatusCommand } from '../../application/commands/update-vendor-status.command';
import { UpdateVendorInsuranceCommand } from '../../application/commands/update-vendor-insurance.command';
import { GetVendorByIdQuery } from '../../application/queries/get-vendor-by-id.query';
import { GetVendorsByOrganizationQuery } from '../../application/queries/get-vendors-by-organization.query';
import { GetVendorStatisticsQuery } from '../../application/queries/get-vendor-statistics.query';
import { GetVendorsWithExpiringQualificationsQuery } from '../../application/queries/get-vendors-with-expiring-qualifications.query';
import {
  VendorStatus,
  VendorType,
} from '../../domain/enums/vendor-status.enum';

/**
 * DTOs for API requests
 */
class AddressDto {
  @IsString()
  street!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  zipCode!: string;

  @IsString()
  country!: string;
}

class CreateVendorDto {
  @IsString()
  vendorName!: string;

  @IsString()
  vendorCode!: string;

  @IsEnum(VendorType)
  vendorType!: VendorType;

  @IsObject()
  billingAddress!: AddressDto;

  @IsString()
  paymentTerms!: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsObject()
  serviceAddress?: AddressDto;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateVendorStatusDto {
  @IsEnum(VendorStatus)
  status!: VendorStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

class InsurancePolicyDto {
  @IsString()
  carrier!: string;

  @IsString()
  policyNumber!: string;

  @IsNumber()
  coverageAmount!: number;

  @IsDateString()
  expirationDate!: string;
}

class UpdateVendorInsuranceDto {
  @IsOptional()
  @IsObject()
  generalLiability?: InsurancePolicyDto;

  @IsOptional()
  @IsObject()
  workersCompensation?: InsurancePolicyDto;

  @IsOptional()
  @IsObject()
  autoLiability?: InsurancePolicyDto;

  @IsOptional()
  @IsObject()
  professionalLiability?: InsurancePolicyDto;

  @IsOptional()
  @IsObject()
  environmentalLiability?: InsurancePolicyDto;

  @IsOptional()
  @IsObject()
  umbrella?: InsurancePolicyDto;
}

/**
 * Vendors Controller
 * RESTful API endpoints for vendor management
 * Follows OpenAPI/Swagger documentation standards
 */
@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Vendor code already exists' })
  async createVendor(@Body(ValidationPipe) createVendorDto: CreateVendorDto) {
    this.logger.log(`Creating vendor: ${createVendorDto.vendorName}`);

    const command = new CreateVendorCommand(
      'test-org-id', // TODO: Get from authenticated user context
      createVendorDto.vendorName,
      createVendorDto.vendorCode,
      createVendorDto.vendorType,
      createVendorDto.billingAddress,
      createVendorDto.paymentTerms,
      createVendorDto.taxId,
      createVendorDto.serviceAddress,
      createVendorDto.website,
      createVendorDto.notes,
      'test-user-id', // TODO: Get from authenticated user context
    );

    const vendorId = await this.commandBus.execute(command);

    return {
      id: vendorId,
      message: 'Vendor created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of vendors' })
  @ApiResponse({
    status: 200,
    description: 'List of vendors retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: VendorStatus })
  @ApiQuery({ name: 'vendorType', required: false, enum: VendorType })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  async getVendors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: VendorStatus,
    @Query('vendorType') vendorType?: VendorType,
    @Query('searchTerm') searchTerm?: string,
  ) {
    this.logger.log('Getting vendors list');

    const query = new GetVendorsByOrganizationQuery(
      'test-org-id', // TODO: Get from authenticated user context
      {
        status: status ? [status] : undefined,
        vendorType: vendorType ? [vendorType] : undefined,
        searchTerm,
      },
      {
        page: parseInt(page || '1'),
        limit: parseInt(limit || '20'),
      },
    );

    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorById(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Getting vendor by ID: ${id}`);

    const query = new GetVendorByIdQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update vendor status' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid status or input data' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendorStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateStatusDto: UpdateVendorStatusDto,
  ) {
    this.logger.log(
      `Updating vendor status: ${id} to ${updateStatusDto.status}`,
    );

    const command = new UpdateVendorStatusCommand(
      id,
      updateStatusDto.status,
      updateStatusDto.reason,
      'test-user-id', // TODO: Get from authenticated user context
    );

    await this.commandBus.execute(command);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get vendor statistics' })
  @ApiResponse({
    status: 200,
    description: 'Vendor statistics retrieved successfully',
  })
  async getVendorStatistics() {
    this.logger.log('Getting vendor statistics');

    const query = new GetVendorStatisticsQuery('test-org-id'); // TODO: Get from authenticated user context
    return await this.queryBus.execute(query);
  }

  @Get('expiring-qualifications')
  @ApiOperation({ summary: 'Get vendors with expiring qualifications' })
  @ApiResponse({
    status: 200,
    description: 'Vendors with expiring qualifications retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead (default: 30)',
  })
  async getVendorsWithExpiringQualifications(@Query('days') days?: string) {
    this.logger.log('Getting vendors with expiring qualifications');

    const query = new GetVendorsWithExpiringQualificationsQuery(
      'test-org-id', // TODO: Get from authenticated user context
      parseInt(days || '30'),
    );

    return await this.queryBus.execute(query);
  }

  @Put(':id/insurance')
  @ApiOperation({ summary: 'Update vendor insurance information' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor insurance updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid insurance data' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendorInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) insuranceDto: UpdateVendorInsuranceDto,
  ) {
    this.logger.log(`Updating vendor insurance: ${id}`);

    const insuranceData: any = {};

    if (insuranceDto.generalLiability) {
      insuranceData.generalLiability = {
        ...insuranceDto.generalLiability,
        expirationDate: new Date(insuranceDto.generalLiability.expirationDate),
      };
    }

    if (insuranceDto.workersCompensation) {
      insuranceData.workersCompensation = {
        ...insuranceDto.workersCompensation,
        expirationDate: new Date(
          insuranceDto.workersCompensation.expirationDate,
        ),
      };
    }

    if (insuranceDto.autoLiability) {
      insuranceData.autoLiability = {
        ...insuranceDto.autoLiability,
        expirationDate: new Date(insuranceDto.autoLiability.expirationDate),
      };
    }

    if (insuranceDto.professionalLiability) {
      insuranceData.professionalLiability = {
        ...insuranceDto.professionalLiability,
        expirationDate: new Date(
          insuranceDto.professionalLiability.expirationDate,
        ),
      };
    }

    if (insuranceDto.environmentalLiability) {
      insuranceData.environmentalLiability = {
        ...insuranceDto.environmentalLiability,
        expirationDate: new Date(
          insuranceDto.environmentalLiability.expirationDate,
        ),
      };
    }

    if (insuranceDto.umbrella) {
      insuranceData.umbrella = {
        ...insuranceDto.umbrella,
        expirationDate: new Date(insuranceDto.umbrella.expirationDate),
      };
    }

    const command = new UpdateVendorInsuranceCommand(
      id,
      insuranceData,
      'test-user-id', // TODO: Get from authenticated user context
    );

    await this.commandBus.execute(command);
  }
}
