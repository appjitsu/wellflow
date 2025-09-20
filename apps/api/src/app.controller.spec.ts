import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryService } from './sentry/sentry.service';

describe('AppController', () => {
  let appController: AppController;
  let sentryService: SentryService;

  const mockSentryService = {
    captureMessage: jest.fn(),
    captureException: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SentryService,
          useValue: mockSentryService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    sentryService = app.get<SentryService>(SentryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database', 'connected');
      expect(result.services).toHaveProperty('redis', 'connected');
      expect(result.services).toHaveProperty('sentry');
    });
  });

  describe('testError', () => {
    it('should capture message and throw error', () => {
      expect(() => appController.testError()).toThrow(
        'This is a test error for Sentry',
      );
      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'Test error endpoint called',
        'info',
      );
    });
  });

  describe('testSentry', () => {
    it('should capture message and return success', () => {
      const result = appController.testSentry();

      expect(result).toEqual({ message: 'Sentry test message sent' });
      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'Test Sentry integration',
        'info',
      );
    });
  });
});
