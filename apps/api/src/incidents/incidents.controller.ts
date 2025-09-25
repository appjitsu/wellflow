import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { IncidentsService } from './incidents.service';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../domain/enums/environmental-incident.enums';
import type { EnvironmentalIncidentFilters } from '../domain/repositories/environmental-incident.repository.interface';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import {
  CanCreateIncident,
  CanReadIncident,
} from '../authorization/abilities.decorator';
import { AuditLog } from '../presentation/decorators/audit-log.decorator';

const createIncidentSchema = z.object({
  organizationId: z.string().uuid(),
  reportedByUserId: z.string().uuid(),
  incidentNumber: z.string().min(1),
  incidentType: z.enum(['spill', 'leak', 'emission', 'other']),
  incidentDate: z.coerce.date(),
  discoveryDate: z.coerce.date(),
  location: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  wellId: z.string().uuid().optional(),
  causeAnalysis: z.string().optional(),
  substanceInvolved: z.string().optional(),
  estimatedVolume: z.number().nonnegative().optional(),
  volumeUnit: z.enum(['barrels', 'gallons', 'cubic_feet']).optional(),
});

@Controller('incidents')
@UseGuards(TenantGuard, AbilitiesGuard)
@ApiTags('Environmental Incidents')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @CanCreateIncident()
  @AuditLog({ action: 'create', resource: 'incident' })
  @ApiOperation({ summary: 'Report an environmental incident' })
  @ApiResponse({ status: 201, description: 'Incident reported' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', format: 'uuid' },
        reportedByUserId: { type: 'string', format: 'uuid' },
        incidentNumber: { type: 'string' },
        incidentType: {
          type: 'string',
          enum: ['spill', 'leak', 'emission', 'other'],
        },
        incidentDate: { type: 'string', format: 'date-time' },
        discoveryDate: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        description: { type: 'string' },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        wellId: { type: 'string', format: 'uuid' },
        causeAnalysis: { type: 'string' },
        substanceInvolved: { type: 'string' },
        estimatedVolume: { type: 'number', minimum: 0 },
        volumeUnit: {
          type: 'string',
          enum: ['barrels', 'gallons', 'cubic_feet'],
        },
      },
      required: [
        'organizationId',
        'reportedByUserId',
        'incidentNumber',
        'incidentType',
        'incidentDate',
        'discoveryDate',
        'location',
        'description',
        'severity',
      ],
    },
  })
  async create(@Body() body: unknown) {
    const dto = createIncidentSchema.parse(body);
    return await this.incidentsService.createIncident({
      ...dto,
      incidentType: dto.incidentType as IncidentType,
      severity: dto.severity as IncidentSeverity,
    });
  }

  @Get(':id')
  @CanReadIncident()
  @AuditLog({ action: 'read', resource: 'incident' })
  @ApiOperation({ summary: 'Get incident by ID' })
  @ApiResponse({ status: 200, description: 'Incident retrieved' })
  async getById(@Param('id') id: string) {
    return this.incidentsService.getIncidentById(id);
  }

  @Get()
  @CanReadIncident()
  @AuditLog({ action: 'read', resource: 'incident' })
  @ApiOperation({ summary: 'List incidents' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({ status: 200, description: 'Incidents list' })
  async list(@Query() q: Record<string, string>) {
    if (!q.organizationId) {
      throw new Error('organizationId is required');
    }

    const allowedTypes = ['spill', 'leak', 'emission', 'other'] as const;
    const allowedSeverities = ['low', 'medium', 'high', 'critical'] as const;
    const allowedStatuses = [
      'open',
      'investigating',
      'remediation',
      'closed',
    ] as const;

    const parseList = <T extends readonly string[]>(
      val: string | undefined,
      allowed: T,
    ): T[number][] | undefined =>
      val
        ? val
            .split(',')
            .filter((x): x is T[number] =>
              (allowed as readonly string[]).includes(x),
            )
        : undefined;

    const filters: EnvironmentalIncidentFilters = {
      organizationId: q.organizationId,
      incidentType: parseList(q.incidentType, allowedTypes) as
        | IncidentType[]
        | undefined,
      severity: parseList(q.severity, allowedSeverities) as
        | IncidentSeverity[]
        | undefined,
      status: parseList(q.status, allowedStatuses) as
        | IncidentStatus[]
        | undefined,
      wellId: q.wellId,
      fromDate: q.fromDate ? new Date(q.fromDate) : undefined,
      toDate: q.toDate ? new Date(q.toDate) : undefined,
      regulatoryNotified:
        typeof q.regulatoryNotified !== 'undefined'
          ? q.regulatoryNotified === 'true'
          : undefined,
      search: q.search,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    };
    return this.incidentsService.listIncidents(filters);
  }
}
