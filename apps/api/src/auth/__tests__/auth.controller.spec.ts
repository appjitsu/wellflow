import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';
import { AbilitiesFactory } from '../../authorization/abilities.factory';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      unlockUserAccount: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    } as any;

    const mockAbilitiesFactory = {
      createForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        Reflector,
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
        {
          provide: AbilitiesGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: 'EnhancedRateLimiterService',
          useValue: {
            checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
          },
        },
        {
          provide: 'MetricsService',
          useValue: {
            incrementCounter: jest.fn(),
            recordHistogram: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
