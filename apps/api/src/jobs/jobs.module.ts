import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { JobQueueService } from './services/job-queue.service';
import { JobErrorHandlerService } from './services/job-error-handler.service';
import { JobSchedulerService } from './services/job-scheduler.service';
import { JobMetricsService } from './services/job-metrics.service';
import { BullMQConfigService } from './config/bullmq-config.service';

import { DataValidationProcessor } from './processors/data-validation.processor';
import { ReportGenerationProcessor } from './processors/report-generation.processor';
import { EmailNotificationProcessor } from './processors/email-notification.processor';
import { ThreatIntelligenceProcessor } from './processors/threat-intelligence.processor';
import { JobMonitoringController } from './controllers/job-monitoring.controller';
import { JobSchedulerController } from './controllers/job-scheduler.controller';
import { JobMetricsController } from './controllers/job-metrics.controller';

@Module({
  imports: [ConfigModule, RedisModule, AuthorizationModule],
  controllers: [
    JobMonitoringController,
    JobSchedulerController,
    JobMetricsController,
  ],
  providers: [
    BullMQConfigService,
    JobQueueService,
    JobErrorHandlerService,
    JobSchedulerService,
    JobMetricsService,
    DataValidationProcessor,
    ReportGenerationProcessor,
    EmailNotificationProcessor,
    ThreatIntelligenceProcessor,
  ],
  exports: [JobQueueService, BullMQConfigService, JobMetricsService],
})
export class JobsModule {}
