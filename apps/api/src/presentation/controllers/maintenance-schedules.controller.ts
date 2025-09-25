import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CompleteMaintenanceScheduleCommand } from '../../application/commands/complete-maintenance-schedule.command';
import { CreateMaintenanceScheduleCommand } from '../../application/commands/create-maintenance-schedule.command';
import { GetMaintenanceScheduleByIdQuery } from '../../application/queries/get-maintenance-schedule-by-id.query';
import { GetMaintenanceSchedulesByOrganizationQuery } from '../../application/queries/get-maintenance-schedules-by-organization.query';
import { CreateMaintenanceScheduleDto } from '../../application/dtos/create-maintenance-schedule.dto';
import {
  CompleteMaintenanceScheduleResponseDto,
  CreateMaintenanceScheduleResponseDto,
  MaintenanceScheduleViewDto,
} from '../../application/dtos/maintenance-schedule-response.dto';
import type { MaintenanceStatus } from '../../domain/entities/maintenance-schedule.entity';

const assertCompleteResponse = (
  result: unknown,
): CompleteMaintenanceScheduleResponseDto => {
  if (
    !result ||
    typeof result !== 'object' ||
    typeof (result as { id?: unknown }).id !== 'string' ||
    (result as { status?: unknown }).status !== 'completed'
  ) {
    throw new Error('Invalid maintenance completion response');
  }

  const { id } = result as { id: string };
  return { id, status: 'completed' };
};

const assertCreateResponse = (
  result: unknown,
): CreateMaintenanceScheduleResponseDto => {
  if (
    !result ||
    typeof result !== 'object' ||
    typeof (result as { id?: unknown }).id !== 'string'
  ) {
    throw new Error('Invalid maintenance schedule creation response');
  }

  return { id: (result as { id: string }).id };
};

const assertMaintenanceView = (result: unknown): MaintenanceScheduleViewDto => {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid maintenance schedule view');
  }

  const value = result as {
    id?: unknown;
    organizationId?: unknown;
    equipmentId?: unknown;
    status?: unknown;
  };

  if (
    typeof value.id !== 'string' ||
    typeof value.organizationId !== 'string' ||
    typeof value.equipmentId !== 'string' ||
    typeof value.status !== 'string'
  ) {
    throw new Error('Invalid maintenance schedule view');
  }

  return {
    id: value.id,
    organizationId: value.organizationId,
    equipmentId: value.equipmentId,
    status: value.status as MaintenanceStatus,
  };
};

const assertMaintenanceViewList = (
  result: unknown,
): MaintenanceScheduleViewDto[] => {
  if (!Array.isArray(result)) {
    throw new Error('Invalid maintenance schedule list response');
  }

  return result.map(assertMaintenanceView);
};

@ApiTags('Maintenance Schedules')
@ApiBearerAuth()
@Controller('maintenance-schedules')
export class MaintenanceSchedulesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a maintenance schedule as completed' })
  @ApiResponse({
    status: 200,
    description: 'Completed',
    type: CompleteMaintenanceScheduleResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @HttpCode(200)
  async complete(
    @Param('id') id: string,
  ): Promise<CompleteMaintenanceScheduleResponseDto> {
    const result: unknown = await this.commandBus.execute(
      new CompleteMaintenanceScheduleCommand(id),
    );
    return assertCompleteResponse(result);
  }

  @Post()
  @ApiOperation({ summary: 'Create a maintenance schedule' })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: CreateMaintenanceScheduleResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Body() body: CreateMaintenanceScheduleDto,
  ): Promise<CreateMaintenanceScheduleResponseDto> {
    const result: unknown = await this.commandBus.execute(
      new CreateMaintenanceScheduleCommand(body),
    );
    return assertCreateResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance schedule by id' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: MaintenanceScheduleViewDto,
  })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getById(
    @Param('id') id: string,
  ): Promise<MaintenanceScheduleViewDto | null> {
    const result: unknown = await this.queryBus.execute(
      new GetMaintenanceScheduleByIdQuery(id),
    );
    return result ? assertMaintenanceView(result) : null;
  }

  @Get()
  @ApiOperation({ summary: 'List maintenance schedules for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'equipmentId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: MaintenanceScheduleViewDto,
    isArray: true,
  })
  async list(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('status') status?: MaintenanceStatus,
  ): Promise<MaintenanceScheduleViewDto[]> {
    const result: unknown = await this.queryBus.execute(
      new GetMaintenanceSchedulesByOrganizationQuery(organizationId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        equipmentId,
        status,
      }),
    );
    return assertMaintenanceViewList(result);
  }
}
