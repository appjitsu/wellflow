import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  JobSchedulerService,
  type ScheduledJobConfig,
} from '../services/job-scheduler.service';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * Job Scheduler Controller
 *
 * Provides REST API endpoints for managing scheduled jobs in the WellFlow system.
 * Allows administrators to create, update, delete, and monitor scheduled jobs.
 *
 * Note: Authentication and authorization will be added later
 */
@ApiTags('Job Scheduler')
@Controller('jobs/scheduler')
export class JobSchedulerController {
  constructor(private readonly schedulerService: JobSchedulerService) {}

  /**
   * Get all scheduled jobs
   */
  @Get()
  @ApiOperation({ summary: 'Get all scheduled jobs' })
  @ApiResponse({
    status: 200,
    description: 'List of all scheduled jobs',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              cron: { type: 'string' },
              enabled: { type: 'boolean' },
              timezone: { type: 'string' },
              description: { type: 'string' },
              jobData: { type: 'object' },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  // eslint-disable-next-line @typescript-eslint/require-await
  async getScheduledJobs() {
    const jobs = this.schedulerService.getScheduledJobs();

    return {
      success: true,
      data: jobs,
      count: jobs.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get a specific scheduled job
   */
  @Get(':jobName')
  @ApiOperation({ summary: 'Get a specific scheduled job' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job details',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
  })
  // eslint-disable-next-line @typescript-eslint/require-await
  async getScheduledJob(@Param('jobName') jobName: string) {
    const job = this.schedulerService.getScheduledJob(jobName);

    if (!job) {
      return {
        success: false,
        message: `Scheduled job '${jobName}' not found`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: job,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new scheduled job
   */
  @Post()
  @ApiOperation({ summary: 'Create a new scheduled job' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled job created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid job configuration',
  })
  @HttpCode(HttpStatus.CREATED)
  async createScheduledJob(@Body() jobConfig: ScheduledJobConfig) {
    try {
      await this.schedulerService.scheduleJob(jobConfig);

      return {
        success: true,
        message: `Scheduled job '${jobConfig.name}' created successfully`,
        data: jobConfig,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create scheduled job: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update an existing scheduled job
   */
  @Put(':jobName')
  @ApiOperation({ summary: 'Update an existing scheduled job' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
  })
  async updateScheduledJob(
    @Param('jobName') jobName: string,
    @Body() updates: Partial<ScheduledJobConfig>,
  ) {
    try {
      await this.schedulerService.updateScheduledJob(jobName, updates);

      return {
        success: true,
        message: `Scheduled job '${jobName}' updated successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update scheduled job: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Delete a scheduled job
   */
  @Delete(':jobName')
  @ApiOperation({ summary: 'Delete a scheduled job' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
  })
  async deleteScheduledJob(@Param('jobName') jobName: string) {
    try {
      await this.schedulerService.unscheduleJob(jobName);

      return {
        success: true,
        message: `Scheduled job '${jobName}' deleted successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete scheduled job: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Enable or disable a scheduled job
   */
  @Put(':jobName/toggle')
  @ApiOperation({ summary: 'Enable or disable a scheduled job' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job toggled successfully',
  })
  async toggleScheduledJob(
    @Param('jobName') jobName: string,
    @Body() body: { enabled: boolean },
  ) {
    try {
      await this.schedulerService.toggleScheduledJob(jobName, body.enabled);

      return {
        success: true,
        message: `Scheduled job '${jobName}' ${body.enabled ? 'enabled' : 'disabled'} successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to toggle scheduled job: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get scheduler statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get scheduler statistics' })
  @ApiResponse({
    status: 200,
    description: 'Scheduler statistics',
  })
  async getSchedulerStats() {
    try {
      const stats = await this.schedulerService.getSchedulerStats();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get scheduler stats: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate cron expression
   */
  @Post('validate-cron')
  @ApiOperation({ summary: 'Validate a cron expression' })
  @ApiResponse({
    status: 200,
    description: 'Cron expression validation result',
  })
  // eslint-disable-next-line @typescript-eslint/require-await
  async validateCron(@Body() body: { cron: string; timezone?: string }) {
    try {
      // Basic cron validation (in a real implementation, use a proper cron parser)
      const cronParts = body.cron.trim().split(/\s+/);
      const isValid = cronParts.length === 5 || cronParts.length === 6;

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid cron expression format',
          details:
            'Cron expression must have 5 or 6 parts (minute hour day month weekday [year])',
          timestamp: new Date().toISOString(),
        };
      }

      // Future: Add more sophisticated cron validation using a library like 'cron-parser'

      return {
        success: true,
        message: 'Cron expression is valid',
        data: {
          cron: body.cron,
          timezone: body.timezone || 'UTC',
          parts: {
            minute: cronParts[0],
            hour: cronParts[1],
            day: cronParts[2],
            month: cronParts[3],
            weekday: cronParts[4],
            year: cronParts[5] || '*',
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to validate cron expression: ${error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
