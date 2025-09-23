import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { JobQueueService } from '../services/job-queue.service';
import { BullMQConfigService } from '../config/bullmq-config.service';
import { JobType } from '../types/job.types';

/**
 * Queue statistics interface
 */
interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

/**
 * Queue stats response with optional error
 */
interface QueueStatsResponse extends QueueStats {
  error?: string;
}

/**
 * Job Monitoring Controller
 *
 * Provides Bull-Board UI integration for monitoring BullMQ job queues.
 * Protected by JWT authentication and CASL authorization.
 *
 * Routes:
 * - GET /admin/queues - Bull-Board dashboard
 * - GET /admin/queues/stats - Queue statistics API
 * - POST /admin/queues/:queueName/pause - Pause queue
 * - POST /admin/queues/:queueName/resume - Resume queue
 * - DELETE /admin/queues/:queueName/clean - Clean completed jobs
 */
@ApiTags('Job Monitoring')
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
@ApiBearerAuth()
export class JobMonitoringController {
  private serverAdapter!: ExpressAdapter;

  private static readonly UNKNOWN_ERROR_MESSAGE = 'Unknown error';
  private static readonly QUEUE_NOT_FOUND_DESCRIPTION = 'Queue not found';

  /**
   * Validate that the queue name is a valid JobType
   */
  private validateQueueName(queueName: string): JobType {
    const validQueues = Object.values(JobType);
    if (!validQueues.includes(queueName as JobType)) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }
    return queueName as JobType;
  }

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly bullMQConfig: BullMQConfigService,
  ) {
    this.initializeBullBoard();
  }

  private initializeBullBoard() {
    // Create Express adapter for Bull-Board
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/admin/queues');

    // Get all queues and create adapters
    const queues = this.bullMQConfig.getAllQueues();
    const queueAdapters = queues.map((queue) => new BullMQAdapter(queue));

    // Create Bull-Board instance
    createBullBoard({
      queues: queueAdapters,
      serverAdapter: this.serverAdapter,
    });
  }

  @Get('*')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Access Bull-Board job monitoring dashboard' })
  @ApiResponse({ status: 200, description: 'Bull-Board dashboard' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getBullBoardUI(@Req() req: Request, @Res() res: Response) {
    // Delegate to Bull-Board Express adapter
    const router = this.serverAdapter.getRouter() as (
      req: Request,
      res: Response,
      next: () => void,
    ) => void;
    await Promise.resolve(); // Keep async for potential future async operations
    return router(req, res, () => {
      res.status(404).send('Not Found');
    });
  }

  @Get()
  @CheckAbilities({ action: 'read', subject: 'all' }) // Admin and operators
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats() {
    const queueTypes = [
      JobType.DATA_VALIDATION,
      JobType.REPORT_GENERATION,
      JobType.EMAIL_NOTIFICATION,
    ];
    const stats: Record<JobType, QueueStatsResponse> = {} as Record<
      JobType,
      QueueStatsResponse
    >;

    for (const queueType of queueTypes) {
      try {
        // eslint-disable-next-line security/detect-object-injection
        stats[queueType] = (await this.jobQueueService.getQueueStats(
          queueType,
        )) as QueueStats;
      } catch (error) {
        // eslint-disable-next-line security/detect-object-injection
        stats[queueType] = {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 0,
          error:
            error instanceof Error
              ? error.message
              : JobMonitoringController.UNKNOWN_ERROR_MESSAGE,
        };
      }
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':queueName/pause')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  @ApiResponse({
    status: 404,
    description: JobMonitoringController.QUEUE_NOT_FOUND_DESCRIPTION,
  })
  async pauseQueue(@Param('queueName') queueName: string) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      await this.jobQueueService.pauseQueue(validatedQueueName);
      return {
        success: true,
        message: `Queue '${queueName}' paused successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pause queue '${queueName}': ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post(':queueName/resume')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Resume a paused queue' })
  @ApiResponse({ status: 200, description: 'Queue resumed successfully' })
  @ApiResponse({
    status: 404,
    description: JobMonitoringController.QUEUE_NOT_FOUND_DESCRIPTION,
  })
  async resumeQueue(@Param('queueName') queueName: string) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      await this.jobQueueService.resumeQueue(validatedQueueName);
      return {
        success: true,
        message: `Queue '${queueName}' resumed successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to resume queue '${queueName}': ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Delete(':queueName/clean')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Clean completed and failed jobs from queue' })
  @ApiResponse({ status: 200, description: 'Queue cleaned successfully' })
  @ApiResponse({
    status: 404,
    description: JobMonitoringController.QUEUE_NOT_FOUND_DESCRIPTION,
  })
  async cleanQueue(@Param('queueName') queueName: string) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      await this.jobQueueService.cleanQueue(validatedQueueName, 'completed');
      return {
        success: true,
        message: `Queue '${queueName}' cleaned successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clean queue '${queueName}': ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get(':queueName/jobs/:status')
  @CheckAbilities({ action: 'read', subject: 'all' }) // Admin and operators
  @ApiOperation({ summary: 'Get jobs by status from a specific queue' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  @ApiResponse({
    status: 404,
    description: JobMonitoringController.QUEUE_NOT_FOUND_DESCRIPTION,
  })
  async getJobsByStatus(
    @Param('queueName') queueName: string,
    @Param('status')
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
  ) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      const jobs = await this.jobQueueService.getJobsByStatus(
        validatedQueueName,
        status,
      );

      // Transform jobs for API response (remove sensitive data)
      const transformedJobs = jobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data as Record<string, unknown>, // Job data from BullMQ
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
      }));

      return {
        success: true,
        data: {
          queueName,
          status,
          jobs: transformedJobs,
          count: transformedJobs.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get jobs from queue '${queueName}': ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post(':queueName/jobs/:jobId/retry')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiResponse({ status: 200, description: 'Job retried successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      await this.jobQueueService.retryJob(validatedQueueName, jobId);
      return {
        success: true,
        message: `Job ${jobId} retried successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retry job ${jobId}: ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Delete(':queueName/jobs/:jobId')
  @CheckAbilities({ action: 'manage', subject: 'all' }) // Admin only
  @ApiOperation({ summary: 'Remove a job from queue' })
  @ApiResponse({ status: 200, description: 'Job removed successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    try {
      const validatedQueueName = this.validateQueueName(queueName);
      await this.jobQueueService.removeJob(validatedQueueName, jobId);
      return {
        success: true,
        message: `Job ${jobId} removed successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove job ${jobId}: ${error instanceof Error ? error.message : JobMonitoringController.UNKNOWN_ERROR_MESSAGE}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
