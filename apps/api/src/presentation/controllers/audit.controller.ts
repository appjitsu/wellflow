import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { Action } from '../../authorization/action.enum';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditAction, AuditResourceType } from '../../domain/entities/audit-log.entity';

class AuditLogDto {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  endpoint: string | null;
  method: string | null;
  duration: number | null;
}

class AuditSearchResultDto {
  logs: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

class AuditStatisticsDto {
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  actionsByType: Record<AuditAction, number>;
  resourcesByType: Record<AuditResourceType, number>;
  topUsers: Array<{ userId: string; count: number }>;
  recentActivity: AuditLogDto[];
}

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AuditController {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  @Get('logs')
  @ApiOperation({ summary: 'Search audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Audit logs found', type: AuditSearchResultDto })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'resourceType', required: false, enum: AuditResourceType })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'success', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async searchLogs(
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('action') action?: AuditAction,
    @Query('resourceType') resourceType?: AuditResourceType,
    @Query('resourceId') resourceId?: string,
    @Query('success') success?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    const filters = {
      userId,
      organizationId,
      action,
      resourceType,
      resourceId,
      success: success !== undefined ? success : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.auditLogRepository.search(filters, {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Max 100, min 1
    });

    return {
      ...result,
      logs: result.logs.map(log => ({
        id: log.getId(),
        userId: log.getUserId(),
        organizationId: log.getOrganizationId(),
        action: log.getAction(),
        resourceType: log.getResourceType(),
        resourceId: log.getResourceId(),
        timestamp: log.getTimestamp(),
        ipAddress: log.getIpAddress(),
        userAgent: log.getUserAgent(),
        success: log.getSuccess(),
        errorMessage: log.getErrorMessage(),
        endpoint: log.getEndpoint(),
        method: log.getMethod(),
        duration: log.getDuration(),
      })),
    };
  }

  @Get('logs/user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs', type: AuditSearchResultDto })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async getUserLogs(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    const result = await this.auditLogRepository.findByUserId(userId, {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    });

    return {
      ...result,
      logs: result.logs.map(log => ({
        id: log.getId(),
        userId: log.getUserId(),
        organizationId: log.getOrganizationId(),
        action: log.getAction(),
        resourceType: log.getResourceType(),
        resourceId: log.getResourceId(),
        timestamp: log.getTimestamp(),
        ipAddress: log.getIpAddress(),
        userAgent: log.getUserAgent(),
        success: log.getSuccess(),
        errorMessage: log.getErrorMessage(),
        endpoint: log.getEndpoint(),
        method: log.getMethod(),
        duration: log.getDuration(),
      })),
    };
  }

  @Get('logs/organization/:organizationId')
  @ApiOperation({ summary: 'Get audit logs for a specific organization' })
  @ApiResponse({ status: 200, description: 'Organization audit logs', type: AuditSearchResultDto })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async getOrganizationLogs(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    const result = await this.auditLogRepository.findByOrganizationId(organizationId, {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    });

    return {
      ...result,
      logs: result.logs.map(log => ({
        id: log.getId(),
        userId: log.getUserId(),
        organizationId: log.getOrganizationId(),
        action: log.getAction(),
        resourceType: log.getResourceType(),
        resourceId: log.getResourceId(),
        timestamp: log.getTimestamp(),
        ipAddress: log.getIpAddress(),
        userAgent: log.getUserAgent(),
        success: log.getSuccess(),
        errorMessage: log.getErrorMessage(),
        endpoint: log.getEndpoint(),
        method: log.getMethod(),
        duration: log.getDuration(),
      })),
    };
  }

  @Get('logs/resource/:resourceType/:resourceId')
  @ApiOperation({ summary: 'Get audit logs for a specific resource' })
  @ApiResponse({ status: 200, description: 'Resource audit logs', type: AuditSearchResultDto })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async getResourceLogs(
    @Param('resourceType') resourceType: AuditResourceType,
    @Param('resourceId') resourceId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    const result = await this.auditLogRepository.findByResource(resourceType, resourceId, {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
    });

    return {
      ...result,
      logs: result.logs.map(log => ({
        id: log.getId(),
        userId: log.getUserId(),
        organizationId: log.getOrganizationId(),
        action: log.getAction(),
        resourceType: log.getResourceType(),
        resourceId: log.getResourceId(),
        timestamp: log.getTimestamp(),
        ipAddress: log.getIpAddress(),
        userAgent: log.getUserAgent(),
        success: log.getSuccess(),
        errorMessage: log.getErrorMessage(),
        endpoint: log.getEndpoint(),
        method: log.getMethod(),
        duration: log.getDuration(),
      })),
    };
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get a specific audit log entry' })
  @ApiResponse({ status: 200, description: 'Audit log entry', type: AuditLogDto })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async getAuditLog(@Param('id', ParseUUIDPipe) id: string) {
    const log = await this.auditLogRepository.findById(id);
    if (!log) {
      throw new Error('Audit log not found');
    }

    return {
      id: log.getId(),
      userId: log.getUserId(),
      organizationId: log.getOrganizationId(),
      action: log.getAction(),
      resourceType: log.getResourceType(),
      resourceId: log.getResourceId(),
      timestamp: log.getTimestamp(),
      ipAddress: log.getIpAddress(),
      userAgent: log.getUserAgent(),
      success: log.getSuccess(),
      errorMessage: log.getErrorMessage(),
      endpoint: log.getEndpoint(),
      method: log.getMethod(),
      duration: log.getDuration(),
      oldValues: log.getOldValues(),
      newValues: log.getNewValues(),
      metadata: log.getMetadata(),
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: 200, description: 'Audit statistics', type: AuditStatisticsDto })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @CheckAbilities({ action: Action.Read, subject: 'AuditLog' })
  async getStatistics(
    @Query('organizationId') organizationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const stats = await this.auditLogRepository.getStatistics(filters);

    return {
      ...stats,
      recentActivity: stats.recentActivity.map(log => ({
        id: log.getId(),
        userId: log.getUserId(),
        organizationId: log.getOrganizationId(),
        action: log.getAction(),
        resourceType: log.getResourceType(),
        resourceId: log.getResourceId(),
        timestamp: log.getTimestamp(),
        success: log.getSuccess(),
        errorMessage: log.getErrorMessage(),
        endpoint: log.getEndpoint(),
        method: log.getMethod(),
        duration: log.getDuration(),
      })),
    };
  }
}
