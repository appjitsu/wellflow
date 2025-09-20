import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpStatus,
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
import { CreateWellCommand } from '../../application/commands/create-well.command';
import { UpdateWellStatusCommand } from '../../application/commands/update-well-status.command';
import { GetWellByIdQuery } from '../../application/queries/get-well-by-id.query';
import { GetWellsByOperatorQuery } from '../../application/queries/get-wells-by-operator.query';
import { CreateWellDto } from '../../application/dtos/create-well.dto';
import { UpdateWellStatusDto } from '../../application/dtos/update-well-status.dto';
import { WellDto } from '../../application/dtos/well.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import {
  CanCreateWell,
  CanReadWell,
  CanUpdateWellStatus,
} from '../../authorization/abilities.decorator';
import { AuditLog } from '../decorators/audit-log.decorator';

/**
 * Wells Controller
 * Handles HTTP requests for well management with CASL authorization
 */
@ApiTags('Wells')
@Controller('wells')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
export class WellsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CanCreateWell()
  @AuditLog({ action: 'CREATE_WELL' })
  @ApiOperation({ summary: 'Create a new well' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Well created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Well ID' },
        message: { type: 'string', example: 'Well created successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Well with API number already exists',
  })
  async createWell(
    @Body() createWellDto: CreateWellDto,
    @Request() req: any,
  ): Promise<{ id: string; message: string }> {
    const command = new CreateWellCommand(
      createWellDto.apiNumber,
      createWellDto.name,
      createWellDto.operatorId,
      createWellDto.wellType,
      createWellDto.location,
      createWellDto.leaseId,
      createWellDto.spudDate ? new Date(createWellDto.spudDate) : undefined,
      createWellDto.totalDepth,
      req.user?.id,
    );

    const wellId = await this.commandBus.execute(command);

    return {
      id: wellId,
      message: 'Well created successfully',
    };
  }

  @Get(':id')
  @CanReadWell()
  @ApiOperation({ summary: 'Get well by ID' })
  @ApiParam({ name: 'id', description: 'Well ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Well found',
    type: WellDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Well not found',
  })
  async getWellById(@Param('id') id: string): Promise<WellDto> {
    const query = new GetWellByIdQuery(id);
    return await this.queryBus.execute(query);
  }

  @Get()
  @CanReadWell()
  @ApiOperation({ summary: 'Get wells by operator with pagination' })
  @ApiQuery({ name: 'operatorId', description: 'Operator ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'wellType',
    required: false,
    description: 'Filter by well type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wells retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        wells: {
          type: 'array',
          items: { $ref: '#/components/schemas/WellDto' },
        },
        total: { type: 'number', description: 'Total number of wells' },
        page: { type: 'number', description: 'Current page' },
        limit: { type: 'number', description: 'Items per page' },
        totalPages: { type: 'number', description: 'Total number of pages' },
      },
    },
  })
  async getWellsByOperator(
    @Query('operatorId') operatorId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('wellType') wellType?: string,
  ): Promise<{
    wells: WellDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new GetWellsByOperatorQuery(operatorId, page, limit, {
      status,
      wellType,
    });

    const result = await this.queryBus.execute(query);

    return {
      wells: result.wells,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  @Put(':id/status')
  @CanUpdateWellStatus()
  @AuditLog({ action: 'UPDATE_WELL_STATUS' })
  @ApiOperation({ summary: 'Update well status' })
  @ApiParam({ name: 'id', description: 'Well ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Well status updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Well status updated successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Well not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async updateWellStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateWellStatusDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const command = new UpdateWellStatusCommand(
      id,
      updateStatusDto.status,
      req.user?.id || 'system',
      updateStatusDto.reason,
    );

    await this.commandBus.execute(command);

    return {
      message: 'Well status updated successfully',
    };
  }
}
