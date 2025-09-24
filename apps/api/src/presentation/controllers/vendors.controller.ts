import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
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
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CurrentOrganization } from '../decorators/current-organization.decorator';
import { AuditInterceptor } from '../interceptors/audit.interceptor';
import { CacheInterceptor } from '../interceptors/cache.interceptor';

// User interface for controller
interface User {
  getId(): string;
  getEmail(): string;
  getOrganizationId(): string;
}

// Commands
import { CreateVendorCommand } from '../../application/commands/create-vendor.command';
import { UpdateVendorStatusCommand } from '../../application/commands/update-vendor-status.command';
import {
  InsurancePolicy,
  UpdateVendorInsuranceCommand,
  UpdateVendorInsuranceData,
} from '../../application/commands/update-vendor-insurance.command';
import { AddVendorCertificationCommand } from '../../application/commands/add-vendor-certification.command';
import { UpdateVendorPerformanceCommand } from '../../application/commands/update-vendor-performance.command';

// Queries
import { GetVendorByIdQuery } from '../../application/queries/get-vendor-by-id.query';
import { GetVendorsByOrganizationQuery } from '../../application/queries/get-vendors-by-organization.query';
import { GetVendorStatisticsQuery } from '../../application/queries/get-vendor-statistics.query';
import { GetVendorsWithExpiringQualificationsQuery } from '../../application/queries/get-vendors-with-expiring-qualifications.query';

// DTOs
import {
  CreateVendorDto,
  UpdateVendorStatusDto,
  UpdateVendorPerformanceDto,
  VendorResponseDto,
  InsuranceDto,
  CertificationDto,
  InsurancePolicyDto,
} from '../../application/dtos/vendor.dto';

// Types
import {
  VendorStatus,
  VendorType,
  VendorRating,
} from '../../domain/enums/vendor-status.enum';
import {
  VendorSearchResult,
  VendorStatistics,
} from '../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../domain/entities/vendor.entity';

const VENDOR_NOT_FOUND_MESSAGE = 'Vendor not found';

/**
 * Vendors Controller
 * RESTful API endpoints for vendor management
 * Follows OpenAPI/Swagger documentation standards
 */
@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Create a new vendor',
    description:
      'Creates a new vendor in the system with the provided information',
  })
  @ApiBody({ type: CreateVendorDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vendor created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Vendor code already exists',
  })
  async createVendor(
    @Body(ValidationPipe) createVendorDto: CreateVendorDto,
    @CurrentOrganization() organizationId: string,
    @CurrentUser() user: User,
  ): Promise<{ id: string; message: string }> {
    this.logger.log(
      `Creating vendor: ${createVendorDto.vendorName} for organization: ${organizationId}`,
    );

    const command = new CreateVendorCommand(
      organizationId,
      createVendorDto.vendorName,
      createVendorDto.vendorCode,
      createVendorDto.vendorType,
      createVendorDto.billingAddress,
      createVendorDto.paymentTerms,
      createVendorDto.taxId,
      createVendorDto.serviceAddress,
      createVendorDto.website,
      createVendorDto.notes,
      user.getId(),
    );

    const vendorId: string = await this.commandBus.execute(command);

    return {
      id: vendorId,
      message: 'Vendor created successfully',
    };
  }

  @Get()
  @Roles('admin', 'procurement_manager', 'operator')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get vendors for organization',
    description:
      'Retrieves all vendors for the current organization with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: VendorStatus,
    isArray: true,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'vendorType',
    required: false,
    enum: VendorType,
    isArray: true,
    description: 'Filter by vendor type',
  })
  @ApiQuery({
    name: 'isPrequalified',
    required: false,
    type: Boolean,
    description: 'Filter by qualification status',
  })
  @ApiQuery({
    name: 'performanceRating',
    required: false,
    enum: VendorRating,
    isArray: true,
    description: 'Filter by performance rating',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Search in vendor name or code',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendors retrieved successfully',
    type: [VendorResponseDto],
  })
  async getVendors(
    @CurrentOrganization() organizationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: VendorStatus[],
    @Query('vendorType') vendorType?: VendorType[],
    @Query('isPrequalified') isPrequalified?: boolean,
    @Query('performanceRating') performanceRating?: VendorRating[],
    @Query('searchTerm') searchTerm?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<VendorSearchResult> {
    this.logger.log(`Getting vendors for organization: ${organizationId}`);

    // Build filters
    let statusArray: VendorStatus[] | undefined;
    if (status) {
      statusArray = Array.isArray(status) ? status : [status];
    }

    let vendorTypeArray: VendorType[] | undefined;
    if (vendorType) {
      vendorTypeArray = Array.isArray(vendorType) ? vendorType : [vendorType];
    }

    let performanceRatingArray: VendorRating[] | undefined;
    if (performanceRating) {
      performanceRatingArray = Array.isArray(performanceRating)
        ? performanceRating
        : [performanceRating];
    }

    const filters = {
      status: statusArray,
      vendorType: vendorTypeArray,
      isPrequalified,
      performanceRating: performanceRatingArray,
      searchTerm,
    };

    const pagination = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      sortBy,
      sortOrder,
    };

    const query = new GetVendorsByOrganizationQuery(
      organizationId,
      filters,
      pagination,
    );
    return await this.queryBus.execute(query);
  }

  @Get('statistics')
  @Roles('admin', 'procurement_manager')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get vendor statistics',
    description: 'Retrieves vendor statistics for dashboard display',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor statistics retrieved successfully',
  })
  async getVendorStatistics(
    @CurrentOrganization() organizationId: string,
  ): Promise<VendorStatistics> {
    this.logger.log(
      `Getting vendor statistics for organization: ${organizationId}`,
    );

    const query = new GetVendorStatisticsQuery(organizationId);
    return await this.queryBus.execute(query);
  }

  @Get('expiring-qualifications')
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Get vendors with expiring qualifications',
    description: 'Retrieves vendors with expiring insurance or certifications',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Days until expiration (default: 30)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendors with expiring qualifications retrieved successfully',
    type: [VendorResponseDto],
  })
  async getVendorsWithExpiringQualifications(
    @CurrentOrganization() organizationId: string,
    @Query('days') days: number = 30,
  ): Promise<VendorSearchResult> {
    this.logger.log(
      `Getting vendors with expiring qualifications for organization: ${organizationId}`,
    );

    const query = new GetVendorsWithExpiringQualificationsQuery(
      organizationId,
      days,
    );
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  @Roles('admin', 'procurement_manager', 'operator')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get vendor by ID',
    description: 'Retrieves a specific vendor by its ID',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Vendor ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor retrieved successfully',
    type: VendorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: VENDOR_NOT_FOUND_MESSAGE,
  })
  async getVendorById(@Param('id', ParseUUIDPipe) id: string): Promise<Vendor> {
    this.logger.log(`Getting vendor by ID: ${id}`);

    const query = new GetVendorByIdQuery(id);
    return await this.queryBus.execute(query);
  }

  @Patch(':id/status')
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Update vendor status',
    description: "Updates a vendor's status (approve, reject, suspend, etc.)",
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Vendor ID',
  })
  @ApiBody({ type: UpdateVendorStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: VENDOR_NOT_FOUND_MESSAGE,
  })
  async updateVendorStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateStatusDto: UpdateVendorStatusDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Updating vendor status: ${id} to ${updateStatusDto.status}`,
    );

    const command = new UpdateVendorStatusCommand(
      id,
      updateStatusDto.status,
      updateStatusDto.reason,
      user.getId(),
    );

    await this.commandBus.execute(command);

    return {
      message: 'Vendor status updated successfully',
    };
  }

  @Put(':id/insurance')
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Update vendor insurance',
    description: "Updates a vendor's insurance information",
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Vendor ID',
  })
  @ApiBody({ type: InsuranceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor insurance updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: VENDOR_NOT_FOUND_MESSAGE,
  })
  async updateVendorInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) insuranceDto: InsuranceDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating vendor insurance: ${id}`);

    const command = new UpdateVendorInsuranceCommand(
      id,
      this.convertInsuranceDtoToData(insuranceDto),
      user.getId(),
    );

    await this.commandBus.execute(command);

    return {
      message: 'Vendor insurance updated successfully',
    };
  }

  @Post(':id/certifications')
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Add vendor certification',
    description: 'Adds a new certification to a vendor',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Vendor ID',
  })
  @ApiBody({ type: CertificationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vendor certification added successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: VENDOR_NOT_FOUND_MESSAGE,
  })
  async addVendorCertification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) certificationDto: CertificationDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`Adding certification to vendor: ${id}`);

    const command = new AddVendorCertificationCommand(
      id,
      certificationDto.name,
      certificationDto.issuingBody,
      certificationDto.certificationNumber,
      new Date(certificationDto.issueDate),
      new Date(certificationDto.expirationDate),
      certificationDto.documentPath,
      user.getId(),
    );

    await this.commandBus.execute(command);

    return {
      message: 'Vendor certification added successfully',
    };
  }

  @Patch(':id/performance')
  @Roles('admin', 'procurement_manager')
  @ApiOperation({
    summary: 'Update vendor performance',
    description: "Updates a vendor's performance ratings",
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Vendor ID',
  })
  @ApiBody({ type: UpdateVendorPerformanceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor performance updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: VENDOR_NOT_FOUND_MESSAGE,
  })
  async updateVendorPerformance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) performanceDto: UpdateVendorPerformanceDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating vendor performance: ${id}`);

    const command = new UpdateVendorPerformanceCommand(
      id,
      performanceDto.overallRating,
      performanceDto.safetyRating,
      performanceDto.qualityRating,
      performanceDto.timelinessRating,
      performanceDto.costEffectivenessRating,
      performanceDto.evaluationNotes,
      user.getId(),
    );

    await this.commandBus.execute(command);

    return {
      message: 'Vendor performance updated successfully',
    };
  }

  private convertInsuranceDtoToData(
    dto: InsuranceDto,
  ): UpdateVendorInsuranceData {
    const convertPolicy = (policyDto: InsurancePolicyDto): InsurancePolicy => ({
      carrier: policyDto.carrier,
      policyNumber: policyDto.policyNumber,
      coverageAmount: policyDto.coverageAmount,
      expirationDate: new Date(policyDto.expirationDate),
    });

    return {
      generalLiability: convertPolicy(dto.generalLiability),
      workersCompensation: dto.workersCompensation
        ? convertPolicy(dto.workersCompensation)
        : undefined,
      autoLiability: dto.autoLiability
        ? convertPolicy(dto.autoLiability)
        : undefined,
      professionalLiability: dto.professionalLiability
        ? convertPolicy(dto.professionalLiability)
        : undefined,
      environmentalLiability: dto.environmentalLiability
        ? convertPolicy(dto.environmentalLiability)
        : undefined,
      umbrella: dto.umbrella ? convertPolicy(dto.umbrella) : undefined,
    };
  }
}
