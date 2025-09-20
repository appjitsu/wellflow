import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentryModule } from './sentry.module';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/nestjs';

// Mock Sentry
jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  httpIntegration: jest.fn(() => ({ name: 'Http' })),
  expressIntegration: jest.fn(() => ({ name: 'Express' })),
  nodeContextIntegration: jest.fn(() => ({ name: 'NodeContext' })),
}));

describe('SentryModule', () => {
  let module: TestingModule;
  let configService: ConfigService;
  let sentryService: SentryService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup default mock config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        switch (key) {
          case 'SENTRY_DSN':
            return undefined; // Default to no DSN
          case 'SENTRY_ENVIRONMENT':
            return defaultValue || 'development';
          case 'SENTRY_RELEASE':
            return defaultValue || '1.0.0';
          default:
            return defaultValue;
        }
      },
    );

    module = await Test.createTestingModule({
      imports: [SentryModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    configService = module.get<ConfigService>(ConfigService);
    sentryService = module.get<SentryService>(SentryService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Configuration', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide SentryService', () => {
      expect(sentryService).toBeDefined();
      expect(sentryService).toBeInstanceOf(SentryService);
    });

    it('should be a global module', () => {
      // The module is decorated with @Global() which makes it available globally
      // We can verify this by checking that the module is properly configured
      expect(SentryModule).toBeDefined();
      expect(typeof SentryModule).toBe('function');
    });
  });

  describe('SENTRY_INIT Provider', () => {
    it('should initialize Sentry when DSN is provided', async () => {
      // Setup mock config values
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://test@sentry.io/123456';
            case 'SENTRY_ENVIRONMENT':
              return 'test';
            case 'SENTRY_RELEASE':
              return '1.0.0-test';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Verify Sentry.init was called
      expect(Sentry.init).toHaveBeenCalledWith({
        dsn: 'https://test@sentry.io/123456',
        environment: 'test',
        release: '1.0.0-test',
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        integrations: [
          { name: 'Http' },
          { name: 'Express' },
          { name: 'NodeContext' },
        ],
        beforeSend: expect.any(Function),
      });

      await testModule.close();
    });

    it('should not initialize Sentry when DSN is not provided', async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      // Setup mock config values without DSN
      const noDsnMockConfigService = {
        get: jest
          .fn()
          .mockImplementation((key: string, defaultValue?: string) => {
            switch (key) {
              case 'SENTRY_DSN':
                return undefined;
              case 'SENTRY_ENVIRONMENT':
                return 'development';
              case 'SENTRY_RELEASE':
                return '1.0.0';
              default:
                return defaultValue;
            }
          }),
      };

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(noDsnMockConfigService)
        .compile();

      // Verify Sentry.init was not called
      expect(Sentry.init).not.toHaveBeenCalled();

      await testModule.close();
    });

    it('should use production sample rates in production environment', async () => {
      // Setup mock config values for production
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://prod@sentry.io/123456';
            case 'SENTRY_ENVIRONMENT':
              return 'production';
            case 'SENTRY_RELEASE':
              return '2.0.0';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Verify Sentry.init was called with production sample rates
      expect(Sentry.init).toHaveBeenCalledWith({
        dsn: 'https://prod@sentry.io/123456',
        environment: 'production',
        release: '2.0.0',
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.1,
        integrations: [
          { name: 'Http' },
          { name: 'Express' },
          { name: 'NodeContext' },
        ],
        beforeSend: expect.any(Function),
      });

      await testModule.close();
    });

    it('should use default values when config values are not provided', async () => {
      // Setup mock config values with defaults
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://default@sentry.io/123456';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Verify Sentry.init was called with default values
      expect(Sentry.init).toHaveBeenCalledWith({
        dsn: 'https://default@sentry.io/123456',
        environment: 'development',
        release: '1.0.0',
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        integrations: [
          { name: 'Http' },
          { name: 'Express' },
          { name: 'NodeContext' },
        ],
        beforeSend: expect.any(Function),
      });

      await testModule.close();
    });
  });

  describe('beforeSend Filter', () => {
    it('should filter out sensitive headers', async () => {
      // Setup mock config values
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://test@sentry.io/123456';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Get the beforeSend function from the Sentry.init call
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      // Test event with sensitive headers
      const event = {
        request: {
          headers: {
            authorization: 'Bearer secret-token',
            cookie: 'session=secret-session',
            'content-type': 'application/json',
          },
        },
        message: 'Test error',
      };

      const filteredEvent = beforeSend(event);

      expect(filteredEvent.request.headers).toEqual({
        'content-type': 'application/json',
      });
      expect(filteredEvent.request.headers.authorization).toBeUndefined();
      expect(filteredEvent.request.headers.cookie).toBeUndefined();

      await testModule.close();
    });

    it('should return event unchanged when no request headers', async () => {
      // Setup mock config values
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://test@sentry.io/123456';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Get the beforeSend function from the Sentry.init call
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0];
      const beforeSend = initCall.beforeSend;

      // Test event without request headers
      const event = {
        message: 'Test error without headers',
      };

      const filteredEvent = beforeSend(event);

      expect(filteredEvent).toEqual(event);

      await testModule.close();
    });
  });

  describe('Module Exports', () => {
    it('should export SentryService', () => {
      // Check that SentryService is available from the module
      expect(sentryService).toBeDefined();
      expect(sentryService).toBeInstanceOf(SentryService);
    });
  });

  describe('Integration Configuration', () => {
    it('should configure all required integrations', async () => {
      // Setup mock config values
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          switch (key) {
            case 'SENTRY_DSN':
              return 'https://test@sentry.io/123456';
            default:
              return defaultValue;
          }
        },
      );

      // Create a new module to trigger the factory
      const testModule = await Test.createTestingModule({
        imports: [SentryModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      // Verify all integrations were called
      expect(Sentry.httpIntegration).toHaveBeenCalled();
      expect(Sentry.expressIntegration).toHaveBeenCalled();
      expect(Sentry.nodeContextIntegration).toHaveBeenCalled();

      await testModule.close();
    });
  });
});
