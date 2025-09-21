import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetWellsByOperatorQuery } from '../../application/queries/get-wells-by-operator.query';
import { WellDto } from '../../application/dtos/well.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CanReadWell } from '../../authorization/abilities.decorator';

/**
 * Operators Controller
 * Handles HTTP requests for operator-related operations
 */
@ApiTags('Operators')
@Controller('operators')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
export class OperatorsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':operatorId/wells')
  @CanReadWell()
  @ApiOperation({ summary: 'Get wells by operator ID' })
  @ApiParam({ name: 'operatorId', description: 'Operator ID' })
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
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - insufficient permissions',
  })
  async getWellsByOperator(
    @Param('operatorId') operatorId: string,
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

    const result = await this.queryBus.execute<
      GetWellsByOperatorQuery,
      {
        wells: WellDto[];
        total: number;
      }
    >(query);

    return {
      wells: result.wells,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}
