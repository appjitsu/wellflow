import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '../health.service';
import { DatabaseService } from '../../database/database.service';
import { CircuitBreakerService } from '../../common/resilience/circuit-breaker.service';
import { RetryService } from '../../common/resilience/retry.service';
import { AuditLogService } from '../../application/services/audit-log.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CONNECTION',
          useValue: {
            ping: jest.fn(),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            getHealth: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
