import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateAfeCommand } from '../../application/commands/create-afe.command';
import { SubmitAfeCommand } from '../../application/commands/submit-afe.command';
import { ApproveAfeCommand } from '../../application/commands/approve-afe.command';
import { RejectAfeCommand } from '../../application/commands/reject-afe.command';
import { UpdateAfeCostCommand } from '../../application/commands/update-afe-cost.command';
import { GetAfeByIdQuery } from '../../application/queries/get-afe-by-id.query';
import { GetAfesByOrganizationQuery } from '../../application/queries/get-afes-by-organization.query';
import { GetAfesRequiringApprovalQuery } from '../../application/queries/get-afes-requiring-approval.query';
import { CreateAfeDto } from '../../application/dtos/create-afe.dto';
import { ApproveAfeDto } from '../../application/dtos/approve-afe.dto';
import { RejectAfeDto } from '../../application/dtos/reject-afe.dto';
import { UpdateAfeCostDto } from '../../application/dtos/update-afe-cost.dto';
import { AfeDto } from '../../application/dtos/afe.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import {
  CanCreateAfe,
  CanReadAfe,
  CanSubmitAfe,
  CanApproveAfe,
  CanRejectAfe,
  CanUpdateAfe,
} from '../../authorization/abilities.decorator';
import { AuditLog } from '../decorators/audit-log.decorator';
import { AfeStatus, AfeType } from '../../domain/enums/afe-status.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
}

/**
 * AFEs Controller
 * Handles HTTP requests for AFE management with CASL authorization
 */
const AFE_NOT_FOUND_DESCRIPTION = 'AFE not found';

@ApiTags('AFEs')
@Controller('afes')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class AfesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CanCreateAfe()
  @AuditLog({ action: 'CREATE_AFE' })
  @ApiOperation({ summary: 'Create a new AFE' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'AFE created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'AFE ID' },
        message: { type: 'string', example: 'AFE created successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid AFE data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'AFE number already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  async createAfe(
    @Body() createAfeDto: CreateAfeDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ id: string; message: string }> {
    const command = new CreateAfeCommand(
      req.user.organizationId,
      createAfeDto.afeNumber,
      createAfeDto.afeType,
      createAfeDto.wellId,
      createAfeDto.leaseId,
      createAfeDto.totalEstimatedCost,
      createAfeDto.description,
      req.user.id,
    );

    const afeId = await this.commandBus.execute<CreateAfeCommand, string>(
      command,
    );

    return {
      id: afeId,
      message: 'AFE created successfully',
    };
  }

  @Get(':id')
  @CanReadAfe()
  @ApiOperation({ summary: 'Get AFE by ID' })
  @ApiParam({ name: 'id', description: 'AFE ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFE retrieved successfully',
    type: AfeDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: AFE_NOT_FOUND_DESCRIPTION,
  })
  async getAfeById(@Param('id') id: string): Promise<AfeDto> {
    const query = new GetAfeByIdQuery(id);
    return this.queryBus.execute<GetAfeByIdQuery, AfeDto>(query);
  }

  @Get()
  @CanReadAfe()
  @ApiOperation({ summary: 'Get AFEs for organization' })
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
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AfeStatus,
    description: 'Filter by AFE status',
  })
  @ApiQuery({
    name: 'afeType',
    required: false,
    enum: AfeType,
    description: 'Filter by AFE type',
  })
  @ApiQuery({
    name: 'wellId',
    required: false,
    type: String,
    description: 'Filter by well ID',
  })
  @ApiQuery({
    name: 'leaseId',
    required: false,
    type: String,
    description: 'Filter by lease ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFEs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        afes: {
          type: 'array',
          items: { $ref: '#/components/schemas/AfeDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getAfes(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: AfeStatus,
    @Query('afeType') afeType?: AfeType,
    @Query('wellId') wellId?: string,
    @Query('leaseId') leaseId?: string,
  ): Promise<{
    afes: AfeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = new GetAfesByOrganizationQuery(
      req.user.organizationId,
      page,
      limit,
      {
        status,
        afeType,
        wellId,
        leaseId,
      },
    );

    return this.queryBus.execute(query);
  }

  @Get('pending/approval')
  @CanReadAfe()
  @ApiOperation({ summary: 'Get AFEs requiring approval' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFEs requiring approval retrieved successfully',
    type: [AfeDto],
  })
  async getAfesRequiringApproval(
    @Request() req: AuthenticatedRequest,
  ): Promise<AfeDto[]> {
    const query = new GetAfesRequiringApprovalQuery(req.user.organizationId);
    return this.queryBus.execute<GetAfesRequiringApprovalQuery, AfeDto[]>(
      query,
    );
  }

  @Put(':id/submit')
  @CanSubmitAfe()
  @AuditLog({ action: 'SUBMIT_AFE' })
  @ApiOperation({ summary: 'Submit AFE for approval' })
  @ApiParam({ name: 'id', description: 'AFE ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFE submitted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'AFE submitted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: AFE_NOT_FOUND_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'AFE cannot be submitted',
  })
  @HttpCode(HttpStatus.OK)
  async submitAfe(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new SubmitAfeCommand(id, req.user.id);
    await this.commandBus.execute(command);

    return {
      message: 'AFE submitted successfully',
    };
  }

  @Put(':id/approve')
  @CanApproveAfe()
  @AuditLog({ action: 'APPROVE_AFE' })
  @ApiOperation({ summary: 'Approve AFE' })
  @ApiParam({ name: 'id', description: 'AFE ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFE approved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'AFE approved successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: AFE_NOT_FOUND_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'AFE cannot be approved',
  })
  @HttpCode(HttpStatus.OK)
  async approveAfe(
    @Param('id') id: string,
    @Body() approveAfeDto: ApproveAfeDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new ApproveAfeCommand(
      id,
      req.user.id,
      approveAfeDto.approvedAmount,
      approveAfeDto.comments,
    );
    await this.commandBus.execute(command);

    return {
      message: 'AFE approved successfully',
    };
  }

  @Put(':id/reject')
  @CanRejectAfe()
  @AuditLog({ action: 'REJECT_AFE' })
  @ApiOperation({ summary: 'Reject AFE' })
  @ApiParam({ name: 'id', description: 'AFE ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFE rejected successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'AFE rejected successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: AFE_NOT_FOUND_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'AFE cannot be rejected',
  })
  @HttpCode(HttpStatus.OK)
  async rejectAfe(
    @Param('id') id: string,
    @Body() rejectAfeDto: RejectAfeDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new RejectAfeCommand(id, req.user.id, rejectAfeDto.reason);
    await this.commandBus.execute(command);

    return {
      message: 'AFE rejected successfully',
    };
  }

  @Put(':id/cost')
  @CanUpdateAfe()
  @AuditLog({ action: 'UPDATE_AFE_COST' })
  @ApiOperation({ summary: 'Update AFE costs' })
  @ApiParam({ name: 'id', description: 'AFE ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AFE costs updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'AFE costs updated successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: AFE_NOT_FOUND_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'AFE costs cannot be updated',
  })
  @HttpCode(HttpStatus.OK)
  async updateAfeCost(
    @Param('id') id: string,
    @Body() updateAfeCostDto: UpdateAfeCostDto,
    @Request() req?: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new UpdateAfeCostCommand(
      id,
      updateAfeCostDto.estimatedCost,
      updateAfeCostDto.actualCost,
      req?.user?.id || 'system',
    );
    await this.commandBus.execute(command);

    return {
      message: 'AFE costs updated successfully',
    };
  }
}
