import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CreateWorkoverDto } from '../../application/dtos/create-workover.dto';
import { WorkoverDto } from '../../application/dtos/workover.dto';
import { WorkoverStatus } from '../../domain/enums/workover-status.enum';
import { CreateWorkoverCommand } from '../../application/commands/create-workover.command';
import { GetWorkoverByIdQuery } from '../../application/queries/get-workover-by-id.query';
import { GetWorkoversByOrganizationQuery } from '../../application/queries/get-workovers-by-organization.query';
import {
  CanCreateWorkover,
  CanReadWorkover,
} from '../../authorization/abilities.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; organizationId: string };
}

@ApiTags('Workovers')
@Controller('workovers')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class WorkoversController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CanCreateWorkover()
  @ApiOperation({ summary: 'Create a new workover' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workover created',
    schema: {
      type: 'object',
      properties: { id: { type: 'string' }, message: { type: 'string' } },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateWorkoverDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ id: string; message: string }> {
    const command = new CreateWorkoverCommand(
      dto.organizationId ?? req.user.organizationId,
      dto.wellId,
      {
        afeId: dto.afeId,
        reason: dto.reason,
        status: dto.status,
        startDate: dto.startDate,
        endDate: dto.endDate,
        preProductionSnapshot: dto.preProductionSnapshot,
        postProductionSnapshot: dto.postProductionSnapshot,
      },
    );
    const id = await this.commandBus.execute<CreateWorkoverCommand, string>(
      command,
    );
    return { id, message: 'Workover created' };
  }

  @Get(':id')
  @CanReadWorkover()
  @ApiOperation({ summary: 'Get workover by ID' })
  @ApiParam({ name: 'id', description: 'Workover ID' })
  @ApiResponse({ status: HttpStatus.OK, type: WorkoverDto })
  async getById(@Param('id') id: string): Promise<WorkoverDto> {
    return this.queryBus.execute<GetWorkoverByIdQuery, WorkoverDto>(
      new GetWorkoverByIdQuery(id),
    );
  }

  @Get()
  @CanReadWorkover()
  @ApiOperation({ summary: 'List workovers for organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: WorkoverStatus })
  @ApiQuery({ name: 'wellId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        workovers: {
          type: 'array',
          items: { $ref: '#/components/schemas/WorkoverDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: WorkoverStatus,
    @Query('wellId') wellId?: string,
  ): Promise<{
    workovers: WorkoverDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.queryBus.execute(
      new GetWorkoversByOrganizationQuery(
        req.user.organizationId,
        page,
        limit,
        { status, wellId },
      ),
    );
  }
}
