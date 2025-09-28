import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedRateLimitGuard } from '../enhanced-rate-limit.guard';
import { EnhancedRateLimiterService } from '../enhanced-rate-limiter.service';
import { MetricsService } from '../../../monitoring/metrics.service';

describe('EnhancedRateLimitGuard', () => {
  let service: EnhancedRateLimitGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedRateLimitGuard,
        {
          provide: EnhancedRateLimiterService,
          useValue: {
            checkRateLimit: jest.fn(),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            recordApiRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnhancedRateLimitGuard>(EnhancedRateLimitGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
