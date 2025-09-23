import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { randomBytes } from 'crypto';
import { BullMQConfigService } from '../config/bullmq-config.service';
import {
  JobType,
  ReportGenerationJobData,
  FormPRReportJobData,
  JIBStatementJobData,
  ProductionSummaryJobData,
  ReportJobResult,
} from '../types/job.types';

/**
 * Report Generation Processor
 *
 * Processes report generation jobs for oil & gas compliance and analytics.
 * Generates regulatory reports, financial statements, and production summaries.
 *
 * Report Types:
 * - Form PR (Texas Railroad Commission Production Reports)
 * - JIB Statements (Joint Interest Billing)
 * - Production Summary Reports
 */
@Injectable()
export class ReportGenerationProcessor implements OnModuleInit {
  private readonly logger = new Logger(ReportGenerationProcessor.name);
  private worker!: Worker;

  constructor(private readonly bullMQConfig: BullMQConfigService) {}

  async onModuleInit() {
    await this.initializeWorker();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initializeWorker() {
    const queueConfig = this.bullMQConfig.getQueueConfig(
      JobType.REPORT_GENERATION,
    );

    this.worker = new Worker(
      JobType.REPORT_GENERATION,
      async (job: Job<ReportGenerationJobData>) => {
        return await this.processJob(job);
      },
      {
        connection: this.bullMQConfig.getRedisConnection(),
        ...queueConfig?.workerOptions,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Report generation job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Report generation job ${job?.id} failed: ${err.message}`,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Report generation worker error: ${err.message}`);
    });

    // Register worker with config service
    this.bullMQConfig.registerWorker(JobType.REPORT_GENERATION, this.worker);

    this.logger.log('Report generation processor initialized');
  }

  private async processJob(
    job: Job<ReportGenerationJobData>,
  ): Promise<ReportJobResult> {
    const startTime = Date.now();
    this.logger.log(`Processing report generation job ${job.id}: ${job.name}`);

    try {
      const { data } = job;
      let result: ReportJobResult;

      // Update progress
      await job.updateProgress(10);

      // Route to specific report handler based on data type
      if (
        'wellIds' in data &&
        'reportPeriod' in data &&
        'reportFormat' in data
      ) {
        result = await this.generateFormPRReport(data, job);
      } else if ('leaseId' in data && 'statementPeriod' in data) {
        result = await this.generateJIBStatement(data, job);
      } else if ('aggregationType' in data) {
        result = await this.generateProductionSummary(data, job);
      } else {
        throw new Error('Unknown report generation job type');
      }

      result.processingTime = Date.now() - startTime;

      // Final progress update
      await job.updateProgress(100);

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Report generation job ${job.id} failed: ${errorMessage}`,
      );

      return {
        success: false,
        message: `Report generation failed: ${errorMessage}`,
        errors: [errorMessage],
        processingTime,
        reportId: '',
        generatedAt: new Date(),
      };
    }
  }

  private async generateFormPRReport(
    data: FormPRReportJobData,
    job: Job,
  ): Promise<ReportJobResult> {
    this.logger.log(
      `Generating Form PR report for ${data.wellIds.length} wells`,
    );

    // Simulate report generation steps
    await job.updateProgress(25);
    await this.simulateDelay(1000); // Data collection

    await job.updateProgress(50);
    await this.simulateDelay(2000); // Report compilation

    await job.updateProgress(75);
    await this.simulateDelay(1500); // Format generation

    // Generate mock report ID and URL
    const reportId = `form-pr-${Date.now()}`;
    const reportUrl = `https://storage.wellflow.com/reports/${reportId}.${data.reportFormat}`;

    return {
      success: true,
      message: `Form PR report generated successfully for ${data.wellIds.length} wells`,
      reportId,
      reportUrl,
      reportSize:
        Math.floor((randomBytes(4).readUInt32BE(0) / 0xffffffff) * 1000000) +
        100000, // Random size in bytes
      generatedAt: new Date(),
    };
  }

  private async generateJIBStatement(
    data: JIBStatementJobData,
    job: Job,
  ): Promise<ReportJobResult> {
    this.logger.log(`Generating JIB statement for lease ${data.leaseId}`);

    // Simulate JIB statement generation steps
    await job.updateProgress(20);
    await this.simulateDelay(800); // Lease data retrieval

    await job.updateProgress(40);
    await this.simulateDelay(1200); // Cost calculations

    await job.updateProgress(60);
    await this.simulateDelay(1000); // Revenue calculations

    await job.updateProgress(80);
    await this.simulateDelay(800); // Statement formatting

    const reportId = `jib-${data.leaseId}-${Date.now()}`;
    const reportUrl = `https://storage.wellflow.com/reports/${reportId}.pdf`;

    // If email delivery is requested, simulate email sending
    if (data.recipientEmails.length > 0) {
      this.logger.log(
        `Sending JIB statement to ${data.recipientEmails.length} recipients`,
      );
      await this.simulateDelay(500);
    }

    return {
      success: true,
      message: `JIB statement generated successfully for lease ${data.leaseId}`,
      reportId,
      reportUrl,
      reportSize:
        Math.floor((randomBytes(4).readUInt32BE(0) / 0xffffffff) * 500000) +
        50000,
      generatedAt: new Date(),
    };
  }

  private async generateProductionSummary(
    data: ProductionSummaryJobData,
    job: Job,
  ): Promise<ReportJobResult> {
    this.logger.log(
      `Generating production summary report (${data.aggregationType})`,
    );

    // Simulate production summary generation steps
    await job.updateProgress(15);
    await this.simulateDelay(1500); // Data aggregation

    await job.updateProgress(35);
    await this.simulateDelay(2000); // Statistical calculations

    await job.updateProgress(55);
    await this.simulateDelay(1200); // Chart generation

    await job.updateProgress(75);
    await this.simulateDelay(1000); // Report formatting

    await job.updateProgress(90);
    await this.simulateDelay(500); // Final compilation

    const reportId = `production-summary-${data.aggregationType}-${Date.now()}`;
    const reportUrl = `https://storage.wellflow.com/reports/${reportId}.pdf`;

    const wellCount = data.wellIds?.length || 0;
    const leaseCount = data.leaseIds?.length || 0;

    return {
      success: true,
      message: `Production summary report (${data.aggregationType}) generated successfully`,
      data: {
        wellCount,
        leaseCount,
        aggregationType: data.aggregationType,
        reportPeriod: data.reportPeriod,
      },
      reportId,
      reportUrl,
      reportSize:
        Math.floor((randomBytes(4).readUInt32BE(0) / 0xffffffff) * 2000000) +
        200000,
      generatedAt: new Date(),
    };
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Report generation processor closed');
    }
  }
}
