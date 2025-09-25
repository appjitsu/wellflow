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
import { CreateDrillingProgramDto } from '../../application/dtos/create-drilling-program.dto';
import { DrillingProgramDto } from '../../application/dtos/drilling-program.dto';
import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';
import { CreateDrillingProgramCommand } from '../../application/commands/create-drilling-program.command';
import { GetDrillingProgramByIdQuery } from '../../application/queries/get-drilling-program-by-id.query';
import { GetDrillingProgramsByOrganizationQuery } from '../../application/queries/get-drilling-programs-by-organization.query';
import {
  CanCreateDrillingProgram,
  CanReadDrillingProgram,
} from '../../authorization/abilities.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; organizationId: string };
}

@ApiTags('Drilling Programs')
@Controller('drilling-programs')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class DrillingProgramsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CanCreateDrillingProgram()
  @ApiOperation({ summary: 'Create a new drilling program' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Drilling program created',
    schema: {
      type: 'object',
      properties: { id: { type: 'string' }, message: { type: 'string' } },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateDrillingProgramDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ id: string; message: string }> {
    const command = new CreateDrillingProgramCommand(
      dto.organizationId ?? req.user.organizationId,
      dto.wellId,
      dto.programName,
      {
        afeId: dto.afeId,
        status: dto.status,
        version: dto.version,
        program: dto.program,
        hazards: dto.hazards,
        approvals: dto.approvals,
      },
    );
    const id = await this.commandBus.execute<
      CreateDrillingProgramCommand,
      string
    >(command);
    return { id, message: 'Drilling program created' };
  }

  @Get(':id')
  @CanReadDrillingProgram()
  @ApiOperation({ summary: 'Get drilling program by ID' })
  @ApiParam({ name: 'id', description: 'Drilling Program ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DrillingProgramDto })
  async getById(@Param('id') id: string): Promise<DrillingProgramDto> {
    return this.queryBus.execute<
      GetDrillingProgramByIdQuery,
      DrillingProgramDto
    >(new GetDrillingProgramByIdQuery(id));
  }

  @Get()
  @CanReadDrillingProgram()
  @ApiOperation({ summary: 'List drilling programs for organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DrillingProgramStatus })
  @ApiQuery({ name: 'wellId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        programs: {
          type: 'array',
          items: { $ref: '#/components/schemas/DrillingProgramDto' },
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
    @Query('status') status?: DrillingProgramStatus,
    @Query('wellId') wellId?: string,
  ): Promise<{
    programs: DrillingProgramDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.queryBus.execute(
      new GetDrillingProgramsByOrganizationQuery(
        req.user.organizationId,
        page,
        limit,
        { status, wellId },
      ),
    );
  }
}
