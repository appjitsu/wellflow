import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitingController } from '../rate-limiting.controller';
import { EnhancedRateLimiterService } from '../enhanced-rate-limiter.service';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';

describe('RateLimitingController', () => {
  let controller: RateLimitingController;

  const mockRateLimiterService = {
    getAllTierConfigs: jest.fn(),
    getUserRateLimitStatus: jest.fn(),
    updateUserTier: jest.fn(),
    resetUserLimits: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
  const mockReflector = {};
  const mockAbilitiesFactory = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateLimitingController],
      providers: [
        {
          provide: EnhancedRateLimiterService,
          useValue: mockRateLimiterService,
        },
        {
          provide: 'Reflector',
          useValue: mockReflector,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
      ],
    })
      .overrideGuard('JwtAuthGuard')
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<RateLimitingController>(RateLimitingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
