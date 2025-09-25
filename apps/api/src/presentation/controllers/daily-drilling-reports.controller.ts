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
import { SubmitDailyDrillingReportCommand } from '../../application/commands/submit-daily-drilling-report.command';
import { CreateDailyDrillingReportCommand } from '../../application/commands/create-daily-drilling-report.command';
import { GetDailyDrillingReportByIdQuery } from '../../application/queries/get-daily-drilling-report-by-id.query';
import { GetDailyDrillingReportsByOrganizationQuery } from '../../application/queries/get-daily-drilling-reports-by-organization.query';
import { CreateDailyDrillingReportDto } from '../../application/dtos/create-daily-drilling-report.dto';
import {
  CreateDailyDrillingReportResponseDto,
  DailyDrillingReportViewDto,
  SubmitDailyDrillingReportResponseDto,
} from '../../application/dtos/daily-drilling-report-response.dto';

const assertSubmitResponse = (
  result: unknown,
): SubmitDailyDrillingReportResponseDto => {
  if (
    !result ||
    typeof result !== 'object' ||
    typeof (result as { id?: unknown }).id !== 'string' ||
    (result as { status?: unknown }).status !== 'submitted'
  ) {
    throw new Error('Invalid submit daily drilling report response');
  }

  const { id } = result as { id: string };
  return { id, status: 'submitted' };
};

const assertCreateResponse = (
  result: unknown,
): CreateDailyDrillingReportResponseDto => {
  if (
    !result ||
    typeof result !== 'object' ||
    typeof (result as { id?: unknown }).id !== 'string'
  ) {
    throw new Error('Invalid create daily drilling report response');
  }

  return { id: (result as { id: string }).id };
};

const assertView = (result: unknown): DailyDrillingReportViewDto => {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid daily drilling report view');
  }

  const value = result as {
    id?: unknown;
    organizationId?: unknown;
    wellId?: unknown;
    reportDate?: unknown;
  };

  if (
    typeof value.id !== 'string' ||
    typeof value.organizationId !== 'string' ||
    typeof value.wellId !== 'string' ||
    typeof value.reportDate !== 'string'
  ) {
    throw new Error('Invalid daily drilling report view');
  }

  return {
    id: value.id,
    organizationId: value.organizationId,
    wellId: value.wellId,
    reportDate: value.reportDate,
  };
};

const assertViewList = (result: unknown): DailyDrillingReportViewDto[] => {
  if (!Array.isArray(result)) {
    throw new Error('Invalid daily drilling report list response');
  }

  return result.map(assertView);
};

@ApiTags('Daily Drilling Reports')
@ApiBearerAuth()
@Controller('daily-drilling-reports')
export class DailyDrillingReportsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a DDR' })
  @ApiResponse({
    status: 200,
    description: 'Submitted',
    type: SubmitDailyDrillingReportResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @HttpCode(200)
  async submit(
    @Param('id') id: string,
  ): Promise<SubmitDailyDrillingReportResponseDto> {
    const result: unknown = await this.commandBus.execute(
      new SubmitDailyDrillingReportCommand(id),
    );
    return assertSubmitResponse(result);
  }

  @Post()
  @ApiOperation({ summary: 'Create a daily drilling report' })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: CreateDailyDrillingReportResponseDto,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(
    @Body() body: CreateDailyDrillingReportDto,
  ): Promise<CreateDailyDrillingReportResponseDto> {
    const result: unknown = await this.commandBus.execute(
      new CreateDailyDrillingReportCommand(body),
    );
    return assertCreateResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a DDR by id' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: DailyDrillingReportViewDto,
  })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getById(
    @Param('id') id: string,
  ): Promise<DailyDrillingReportViewDto | null> {
    const result: unknown = await this.queryBus.execute(
      new GetDailyDrillingReportByIdQuery(id),
    );
    return result ? assertView(result) : null;
  }

  @Get()
  @ApiOperation({ summary: 'List DDRs for an organization' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'wellId', required: false, type: String })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: DailyDrillingReportViewDto,
    isArray: true,
  })
  async list(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('wellId') wellId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<DailyDrillingReportViewDto[]> {
    const result: unknown = await this.queryBus.execute(
      new GetDailyDrillingReportsByOrganizationQuery(organizationId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        wellId,
        fromDate,
        toDate,
      }),
    );
    return assertViewList(result);
  }
}
