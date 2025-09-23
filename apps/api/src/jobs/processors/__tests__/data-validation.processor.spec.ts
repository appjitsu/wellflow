import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataValidationProcessor } from '../data-validation.processor';
import { BullMQConfigService } from '../../config/bullmq-config.service';
import { JobErrorHandlerService } from '../../services/job-error-handler.service';
import { JobMetricsService } from '../../services/job-metrics.service';
import {
  LeaseDataValidationJobData,
  WellDataValidationJobData,
  ProductionDataValidationJobData,
} from '../../types/job.types';

describe('DataValidationProcessor', () => {
  let processor: DataValidationProcessor;
  let _bullMQConfig: jest.Mocked<BullMQConfigService>;
  let _errorHandler: jest.Mocked<JobErrorHandlerService>;
  let metricsService: jest.Mocked<JobMetricsService>;

  const mockJob = (data: any) =>
    ({
      id: 'test-job-123',
      name: 'test-validation',
      data,
      updateProgress: jest.fn(),
      attemptsMade: 0,
      queueName: 'data-validation',
    }) as unknown as Job;

  beforeEach(async () => {
    const mockBullMQConfig = {
      getQueueConfig: jest.fn().mockReturnValue({
        workerOptions: { concurrency: 1 },
      }),
      getRedisConnection: jest.fn().mockReturnValue({}),
      registerWorker: jest.fn(),
    };

    const mockErrorHandler = {
      handleJobFailure: jest.fn(),
    };

    const mockMetricsService = {
      recordJobStart: jest.fn(),
      recordJobComplete: jest.fn(),
      recordJobFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataValidationProcessor,
        {
          provide: BullMQConfigService,
          useValue: mockBullMQConfig,
        },
        {
          provide: JobErrorHandlerService,
          useValue: mockErrorHandler,
        },
        {
          provide: JobMetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    processor = module.get<DataValidationProcessor>(DataValidationProcessor);
    _bullMQConfig = module.get(BullMQConfigService);
    _errorHandler = module.get(JobErrorHandlerService);
    metricsService = module.get(JobMetricsService);

    // Mock the logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lease Data Validation', () => {
    it('should successfully validate lease data', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'lease-123',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const job = mockJob(jobData);

      // Access the private method through reflection for testing
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.validationResults).toBeDefined();
      expect(result.validationResults.passed).toBe(true);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(metricsService.recordJobStart).toHaveBeenCalledWith(job);
    });

    it('should handle lease data validation errors', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: '', // Invalid lease ID
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid lease ID');
      expect(result.validationResults.passed).toBe(false);
    });
  });

  describe('Well Data Validation', () => {
    it('should successfully validate well data', async () => {
      const jobData: WellDataValidationJobData = {
        wellId: 'well-789',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'equipment_status',
        includeMetrics: true,
        alertOnAnomalies: true,
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.validationResults.passed).toBe(true);
      expect(result.validationResults.validatedFields).toContain(
        'equipment_status',
      );
    });

    it('should detect well data anomalies', async () => {
      const jobData: WellDataValidationJobData = {
        wellId: 'well-anomaly',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'equipment_status',
        includeMetrics: true,
        alertOnAnomalies: true,
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.validationResults.warnings).toContain(
        'Anomaly detected in equipment readings',
      );
    });
  });

  describe('Production Data Validation', () => {
    it('should successfully validate production data', async () => {
      const jobData: ProductionDataValidationJobData = {
        wellId: 'well-123',
        productionRecordId: 'prod-123',
        validationRules: ['rule1', 'rule2'],
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'daily_production',
        includeQualityChecks: true,
        validateAgainstTargets: true,
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.validationResults.passed).toBe(true);
      expect(result.validationResults.validatedFields).toContain(
        'daily_production',
      );
    });

    it('should validate production against targets', async () => {
      const jobData: ProductionDataValidationJobData = {
        wellId: 'well-456',
        productionRecordId: 'prod-low',
        validationRules: ['target-validation'],
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'daily_production',
        includeQualityChecks: true,
        validateAgainstTargets: true,
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.validationResults.warnings).toContain(
        'Production below target threshold',
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown job types', async () => {
      const jobData = {
        unknownField: 'test',
        organizationId: 'org-456',
        timestamp: new Date(),
      };

      const job = mockJob(jobData);
      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unknown data validation job type');
    });

    it('should handle processing exceptions', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'error-lease',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const job = mockJob(jobData);

      // Mock an internal error
      jest
        .spyOn(processor as any, 'validateLeaseData')
        .mockRejectedValue(new Error('Database connection failed'));

      const result = await (processor as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database connection failed');
    });
  });

  describe('Progress Tracking', () => {
    it('should update job progress during processing', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'lease-progress',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const job = mockJob(jobData);
      await (processor as any).processJob(job);

      expect(job.updateProgress).toHaveBeenCalledWith(100);
    });
  });

  describe('Metrics Integration', () => {
    it('should record job start metrics', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'lease-metrics',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const job = mockJob(jobData);
      await (processor as any).processJob(job);

      expect(metricsService.recordJobStart).toHaveBeenCalledWith(job);
    });
  });
});
