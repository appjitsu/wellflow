import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JobMetricsService } from '../services/job-metrics.service';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * Job Metrics Controller
 *
 * Provides REST API endpoints for accessing job metrics, queue statistics,
 * and system performance data in the WellFlow system.
 *
 * Features:
 * - Job-level metrics and performance data
 * - Queue-level statistics and health monitoring
 * - System-wide analytics and trends
 * - Time-based metric filtering
 * - Organization-specific metrics
 */
@ApiTags('Job Metrics')
@Controller('jobs/metrics')
export class JobMetricsController {
  constructor(private readonly metricsService: JobMetricsService) {}

  /**
   * Get system-wide job metrics
   */
  @Get('system')
  @ApiOperation({ summary: 'Get system-wide job metrics' })
  @ApiResponse({
    status: 200,
    description: 'System metrics including overall performance and statistics',
  })
  async getSystemMetrics() {
    try {
      const metrics = this.metricsService.getSystemMetrics();
      await Promise.resolve(); // Keep async for potential future async operations

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get system metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all queue metrics
   */
  @Get('queues')
  @ApiOperation({ summary: 'Get metrics for all queues' })
  @ApiResponse({
    status: 200,
    description: 'Metrics for all job queues',
  })
  async getAllQueueMetrics() {
    try {
      const metrics = this.metricsService.getAllQueueMetrics();
      await Promise.resolve(); // Keep async for potential future async operations

      return {
        success: true,
        data: metrics,
        count: metrics.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get queue metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get metrics for a specific queue
   */
  @Get('queues/:queueName')
  @ApiOperation({ summary: 'Get metrics for a specific queue' })
  @ApiResponse({
    status: 200,
    description: 'Metrics for the specified queue',
  })
  @ApiResponse({
    status: 404,
    description: 'Queue not found',
  })
  async getQueueMetrics(@Param('queueName') queueName: string) {
    try {
      const metrics = this.metricsService.getQueueMetrics(queueName);
      await Promise.resolve(); // Keep async for potential future async operations

      if (!metrics) {
        return {
          success: false,
          message: `Queue '${queueName}' not found or has no metrics`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get queue metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get metrics for a specific job
   */
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get metrics for a specific job' })
  @ApiResponse({
    status: 200,
    description: 'Metrics for the specified job',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  async getJobMetrics(@Param('jobId') jobId: string) {
    try {
      const metrics = this.metricsService.getJobMetrics(jobId);
      await Promise.resolve(); // Keep async for potential future async operations

      if (!metrics) {
        return {
          success: false,
          message: `Job '${jobId}' not found or has no metrics`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get job metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get job metrics by time range
   */
  @Get('jobs')
  @ApiOperation({ summary: 'Get job metrics by time range' })
  @ApiQuery({
    name: 'startTime',
    required: false,
    description: 'Start time in ISO format (default: 24 hours ago)',
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    description: 'End time in ISO format (default: now)',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Job metrics for the specified time range',
  })
  async getJobMetricsByTimeRange(
    @Query('startTime') startTimeStr?: string,
    @Query('endTime') endTimeStr?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    try {
      // Default to last 24 hours if no time range specified
      const endTime = endTimeStr ? new Date(endTimeStr) : new Date();
      const startTime = startTimeStr
        ? new Date(startTimeStr)
        : new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      let metrics = this.metricsService.getJobMetricsByTimeRange(
        startTime,
        endTime,
      );
      await Promise.resolve(); // Keep async for potential future async operations

      // Filter by organization if specified
      if (organizationId) {
        metrics = metrics.filter(
          (metric) => metric.organizationId === organizationId,
        );
      }

      // Calculate summary statistics
      const completedJobs = metrics.filter((m) => m.status === 'completed');
      const failedJobs = metrics.filter((m) => m.status === 'failed');
      const totalDuration = completedJobs.reduce(
        (sum, m) => sum + (m.duration || 0),
        0,
      );
      const averageDuration =
        completedJobs.length > 0 ? totalDuration / completedJobs.length : 0;
      const successRate =
        metrics.length > 0
          ? (completedJobs.length /
              (completedJobs.length + failedJobs.length)) *
            100
          : 0;

      return {
        success: true,
        data: {
          metrics,
          summary: {
            totalJobs: metrics.length,
            completedJobs: completedJobs.length,
            failedJobs: failedJobs.length,
            averageDuration,
            successRate,
            timeRange: {
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
            },
            organizationId,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get job metrics by time range: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get job metrics by organization
   */
  @Get('organizations/:organizationId')
  @ApiOperation({ summary: 'Get job metrics for a specific organization' })
  @ApiResponse({
    status: 200,
    description: 'Job metrics for the specified organization',
  })
  async getJobMetricsByOrganization(
    @Param('organizationId') organizationId: string,
  ) {
    try {
      const metrics =
        this.metricsService.getJobMetricsByOrganization(organizationId);
      await Promise.resolve(); // Keep async for potential future async operations

      // Calculate organization-specific statistics
      const completedJobs = metrics.filter((m) => m.status === 'completed');
      const failedJobs = metrics.filter((m) => m.status === 'failed');
      const totalDuration = completedJobs.reduce(
        (sum, m) => sum + (m.duration || 0),
        0,
      );
      const averageDuration =
        completedJobs.length > 0 ? totalDuration / completedJobs.length : 0;
      const successRate =
        metrics.length > 0
          ? (completedJobs.length /
              (completedJobs.length + failedJobs.length)) *
            100
          : 0;

      // Group by job type
      const jobsByType = metrics.reduce(
        (acc, metric) => {
          acc[metric.jobType] = (acc[metric.jobType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        success: true,
        data: {
          organizationId,
          metrics,
          summary: {
            totalJobs: metrics.length,
            completedJobs: completedJobs.length,
            failedJobs: failedJobs.length,
            averageDuration,
            successRate,
            jobsByType,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get organization metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clear old metrics
   */
  @Delete('cleanup')
  @ApiOperation({ summary: 'Clear old job metrics' })
  @ApiQuery({
    name: 'olderThanHours',
    required: false,
    description: 'Clear metrics older than specified hours (default: 24)',
  })
  @ApiResponse({
    status: 200,
    description: 'Old metrics cleared successfully',
  })
  @HttpCode(HttpStatus.OK)
  async clearOldMetrics(@Query('olderThanHours') olderThanHours?: string) {
    try {
      const hours = olderThanHours ? parseInt(olderThanHours, 10) : 24;

      if (isNaN(hours) || hours < 1) {
        return {
          success: false,
          message:
            'Invalid olderThanHours parameter. Must be a positive number.',
          timestamp: new Date().toISOString(),
        };
      }

      this.metricsService.clearOldMetrics(hours);
      await Promise.resolve(); // Keep async for potential future async operations

      return {
        success: true,
        message: `Cleared metrics older than ${hours} hours`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear old metrics: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
