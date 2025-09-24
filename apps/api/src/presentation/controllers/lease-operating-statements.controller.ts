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
import { CreateLosCommand } from '../../application/commands/create-los.command';
import { AddLosExpenseCommand } from '../../application/commands/add-los-expense.command';
import { FinalizeLosCommand } from '../../application/commands/finalize-los.command';
import { DistributeLosCommand } from '../../application/commands/distribute-los.command';
import { GetLosByIdQuery } from '../../application/queries/get-los-by-id.query';
import { GetLosByOrganizationQuery } from '../../application/queries/get-los-by-organization.query';
import { GetLosByLeaseQuery } from '../../application/queries/get-los-by-lease.query';
import { GetLosExpenseSummaryQuery } from '../../application/queries/get-los-expense-summary.query';
import {
  CreateLosDto,
  AddExpenseDto,
  LosDto,
  LosListItemDto,
  LosExpenseSummaryDto,
} from '../../application/dtos/los.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { AuditLog } from '../decorators/audit-log.decorator';
import { LosStatus } from '../../domain/enums/los-status.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    organizationId: string;
  };
}

/**
 * Error messages for LOS operations
 */
const LOS_NOT_FOUND_MESSAGE = 'LOS not found';

/**
 * Lease Operating Statements Controller
 * Handles HTTP requests for LOS management with CASL authorization
 */
@ApiTags('Lease Operating Statements')
@Controller('lease-operating-statements')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class LeaseOperatingStatementsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @AuditLog({ action: 'CREATE_LOS' })
  @ApiOperation({ summary: 'Create a new Lease Operating Statement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'LOS created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'LOS ID' },
        message: {
          type: 'string',
          example: 'Lease Operating Statement created successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid LOS data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'LOS already exists for this lease and month',
  })
  @HttpCode(HttpStatus.CREATED)
  async createLos(
    @Body() createLosDto: CreateLosDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ id: string; message: string }> {
    const command = new CreateLosCommand(
      req.user.organizationId,
      createLosDto.leaseId,
      createLosDto.year,
      createLosDto.month,
      createLosDto.notes,
      req.user.id,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const losId = await this.commandBus.execute(command);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: losId,
      message: 'Lease Operating Statement created successfully',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all Lease Operating Statements for organization',
  })
  @ApiQuery({ name: 'status', required: false, enum: LosStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'LOS list retrieved successfully',
    type: [LosListItemDto],
  })
  async getLosStatements(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: LosStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<LosListItemDto[]> {
    const query = new GetLosByOrganizationQuery(
      req.user.organizationId,
      status,
      limit,
      offset,
    );

    return this.queryBus.execute(query);
  }

  @Get('lease/:leaseId')
  @ApiOperation({
    summary: 'Get Lease Operating Statements for a specific lease',
  })
  @ApiParam({ name: 'leaseId', description: 'Lease ID' })
  @ApiQuery({ name: 'status', required: false, enum: LosStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'LOS list for lease retrieved successfully',
    type: [LosListItemDto],
  })
  async getLosByLease(
    @Param('leaseId') leaseId: string,
    @Query('status') status?: LosStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<LosListItemDto[]> {
    const query = new GetLosByLeaseQuery(leaseId, status, limit, offset);
    return this.queryBus.execute(query);
  }

  @Get('summary/expenses')
  @ApiOperation({ summary: 'Get expense summary across leases for date range' })
  @ApiQuery({ name: 'startYear', required: true, type: Number })
  @ApiQuery({ name: 'startMonth', required: true, type: Number })
  @ApiQuery({ name: 'endYear', required: true, type: Number })
  @ApiQuery({ name: 'endMonth', required: true, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expense summary retrieved successfully',
    type: [LosExpenseSummaryDto],
  })
  async getExpenseSummary(
    @Request() req: AuthenticatedRequest,
    @Query('startYear') startYear: number,
    @Query('startMonth') startMonth: number,
    @Query('endYear') endYear: number,
    @Query('endMonth') endMonth: number,
  ): Promise<LosExpenseSummaryDto[]> {
    const query = new GetLosExpenseSummaryQuery(
      req.user.organizationId,
      startYear,
      startMonth,
      endYear,
      endMonth,
    );

    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Lease Operating Statement by ID' })
  @ApiParam({ name: 'id', description: 'LOS ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'LOS retrieved successfully',
    type: LosDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: LOS_NOT_FOUND_MESSAGE,
  })
  async getLosById(@Param('id') id: string): Promise<LosDto> {
    const query = new GetLosByIdQuery(id);
    return this.queryBus.execute(query);
  }

  @Post(':id/expenses')
  @AuditLog({ action: 'ADD_LOS_EXPENSE' })
  @ApiOperation({ summary: 'Add expense line item to LOS' })
  @ApiParam({ name: 'id', description: 'LOS ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Expense added successfully',
    schema: {
      type: 'object',
      properties: {
        expenseId: { type: 'string', description: 'Expense ID' },
        message: { type: 'string', example: 'Expense added successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: LOS_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid expense data or LOS is finalized',
  })
  @HttpCode(HttpStatus.CREATED)
  async addExpense(
    @Param('id') losId: string,
    @Body() addExpenseDto: AddExpenseDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ expenseId: string; message: string }> {
    const command = new AddLosExpenseCommand(
      losId,
      addExpenseDto.description,
      addExpenseDto.category,
      addExpenseDto.type,
      addExpenseDto.amount,
      addExpenseDto.currency || 'USD',
      addExpenseDto.vendorName,
      addExpenseDto.invoiceNumber,
      addExpenseDto.invoiceDate,
      addExpenseDto.notes,
      req.user.id,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expenseId = await this.commandBus.execute(command);

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expenseId,
      message: 'Expense added successfully',
    };
  }

  @Put(':id/finalize')
  @AuditLog({ action: 'FINALIZE_LOS' })
  @ApiOperation({ summary: 'Finalize LOS for distribution' })
  @ApiParam({ name: 'id', description: 'LOS ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'LOS finalized successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'LOS finalized successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: LOS_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'LOS cannot be finalized (not in draft status or no expenses)',
  })
  async finalizeLos(
    @Param('id') losId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new FinalizeLosCommand(losId, req.user.id);
    await this.commandBus.execute(command);

    return {
      message: 'LOS finalized successfully',
    };
  }

  @Put(':id/distribute')
  @AuditLog({ action: 'DISTRIBUTE_LOS' })
  @ApiOperation({ summary: 'Distribute finalized LOS to stakeholders' })
  @ApiParam({ name: 'id', description: 'LOS ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'LOS distributed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'LOS distributed successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: LOS_NOT_FOUND_MESSAGE,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'LOS cannot be distributed (not finalized)',
  })
  async distributeLos(
    @Param('id') losId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const command = new DistributeLosCommand(losId, req.user.id, 'email', 1);
    await this.commandBus.execute(command);

    return {
      message: 'LOS distributed successfully',
    };
  }
}
