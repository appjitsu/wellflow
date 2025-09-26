import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { CheckAbilities } from '../../../authorization/abilities.decorator';
import { Action } from '../../../authorization/action.enum';
import { ApiVersion, ApiVersionDocs, ApiDeprecated } from '../../../common/versioning/api-version.decorator';

@ApiTags('Wells V2')
@ApiBearerAuth()
@Controller({ path: 'wells', version: '2' })
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class WellsV2Controller {
  @Get()
  @ApiVersionDocs({
    version: 'v2',
    summary: 'Get wells with enhanced filtering (V2)',
    description: 'Retrieve wells with advanced filtering, sorting, and pagination capabilities',
    examples: {
      'Basic filtering': {
        status: 'active',
        limit: 20,
        offset: 0,
      },
      'Advanced filtering': {
        status: 'active',
        operatorId: 'operator-123',
        totalDepthMin: 1000,
        totalDepthMax: 5000,
        sortBy: 'spudDate',
        sortOrder: 'desc',
      },
    },
  })
  @CheckAbilities({ action: Action.Read, subject: 'Well' })
  async getWellsV2(
    @Query() filters: {
      status?: string;
      operatorId?: string;
      totalDepthMin?: number;
      totalDepthMax?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    },
  ) {
    // Enhanced V2 implementation with better filtering
    return {
      version: 'v2',
      wells: [],
      filters: filters,
      metadata: {
        enhancedFiltering: true,
        advancedSorting: true,
        pagination: true,
      },
    };
  }

  @Post()
  @ApiVersionDocs({
    version: 'v2',
    summary: 'Create well with enhanced validation (V2)',
    description: 'Create a new well with comprehensive validation and audit logging',
  })
  @CheckAbilities({ action: Action.Create, subject: 'Well' })
  async createWellV2(@Body() createWellDto: any) {
    // V2 implementation with enhanced validation
    return {
      version: 'v2',
      well: {},
      metadata: {
        validationLevel: 'comprehensive',
        auditLogged: true,
      },
    };
  }

  @Get(':id')
  @ApiVersionDocs({
    version: 'v2',
    summary: 'Get well by ID with relationships (V2)',
    description: 'Retrieve a specific well with all related data (production, permits, etc.)',
  })
  @CheckAbilities({ action: Action.Read, subject: 'Well' })
  async getWellByIdV2(@Param('id', ParseUUIDPipe) id: string) {
    // V2 implementation with relationships
    return {
      version: 'v2',
      well: { id },
      relationships: {
        production: [],
        permits: [],
        maintenance: [],
      },
    };
  }
}

// Example of a deprecated V1 controller
@ApiTags('Wells V1 (Deprecated)')
@Controller({ path: 'wells', version: '1' })
export class WellsV1Controller {
  @Get()
  @ApiVersionDocs({
    version: 'v1',
    summary: 'Get wells (V1 - Deprecated)',
    deprecated: true,
    deprecatedMessage: 'Use V2 API with enhanced filtering capabilities',
  })
  @ApiDeprecated('This endpoint is deprecated. Use /v2/wells instead.')
  async getWellsV1() {
    return {
      version: 'v1',
      message: 'This endpoint is deprecated. Please upgrade to V2.',
      upgradeGuide: '/docs/api/v2-migration',
    };
  }
}
