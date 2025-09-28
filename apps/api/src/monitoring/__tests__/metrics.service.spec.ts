import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../metrics.service';
import { DatabaseService } from '../../database/database.service';
import { CircuitBreakerService } from '../../common/resilience/circuit-breaker.service';
import { RetryService } from '../../common/resilience/retry.service';
import { HealthCheckService } from '../../health/health.service';
import { EnhancedEventBusService } from '../../common/events/enhanced-event-bus.service';

describe('MetricsService', () => {
  let service: MetricsService;

  const mockDatabaseService = {
    getConnection: jest.fn(),
    execute: jest.fn(),
  };

  const mockRedis = {
    info: jest.fn(),
    dbsize: jest.fn(),
  };

  const mockCircuitBreakerService = {
    getAllMetrics: jest.fn(),
  };

  const mockRetryService = {
    getMetrics: jest.fn(),
  };

  const mockHealthCheckService = {
    checkHealth: jest.fn(),
  };

  const mockEventBus = {
    getEventMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreakerService,
        },
        {
          provide: RetryService,
          useValue: mockRetryService,
        },
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: EnhancedEventBusService,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
