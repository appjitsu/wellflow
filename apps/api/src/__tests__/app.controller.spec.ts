import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { SentryService } from '../sentry/sentry.service';
import { DatabaseService } from '../database/database.service';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHello: jest.fn(),
  };

  const mockSentryService = {
    captureMessage: jest.fn(),
    captureException: jest.fn(),
  };

  const mockDatabaseService = {
    getDb: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: SentryService,
          useValue: mockSentryService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return the hello message from app service', () => {
      const expectedMessage = 'Hello World!';
      mockAppService.getHello.mockReturnValue(expectedMessage);

      const result = appController.getHello();

      expect(result).toBe(expectedMessage);
      expect(mockAppService.getHello).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return health status with all required fields', () => {
      const mockUptime = 123.456;
      const mockEnv = 'test';
      const mockSentryDsn = 'test-dsn';

      jest.spyOn(process, 'uptime').mockReturnValue(mockUptime);
      mockConfigService.get
        .mockReturnValueOnce(mockEnv) // NODE_ENV
        .mockReturnValueOnce(mockSentryDsn); // SENTRY_DSN

      const result = appController.getHealth();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: mockUptime,
        environment: mockEnv,
        version: '1.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
          sentry: true,
        },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'NODE_ENV',
        'development',
      );
      expect(mockConfigService.get).toHaveBeenCalledWith('SENTRY_DSN');
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return error when database connection is not available', async () => {
      mockDatabaseService.getDb.mockReturnValue(null);

      const result = await appController.getDatabaseHealth();

      expect(result).toEqual({
        status: 'error',
        timestamp: expect.any(String),
        database: {
          connected: false,
          error: 'Database connection not initialized',
          tables: [],
          migrationTableExists: false,
          usersTableExists: false,
          userCount: 0,
          totalTables: 0,
        },
      });
    });

    it('should return database health when connection is available', async () => {
      const mockDb = {
        execute: jest.fn(),
      };
      const mockTables = ['users', '__drizzle_migrations', 'wells'];
      const mockTableResult = {
        rows: mockTables.map((table_name) => ({ table_name })),
      };
      const mockCountResult = {
        rows: [{ count: '5' }],
      };

      mockDatabaseService.getDb.mockReturnValue(mockDb);
      mockDb.execute
        .mockResolvedValueOnce(mockTableResult) // tables query
        .mockResolvedValueOnce(mockCountResult); // count query

      const result = await appController.getDatabaseHealth();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        database: {
          connected: true,
          tables: mockTables,
          migrationTableExists: true,
          usersTableExists: true,
          userCount: 5,
          totalTables: 3,
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Connection failed');
      mockDatabaseService.getDb.mockImplementation(() => {
        throw mockError;
      });

      const result = await appController.getDatabaseHealth();

      expect(result).toEqual({
        status: 'error',
        timestamp: expect.any(String),
        database: {
          connected: false,
          error: mockError.message,
          tables: [],
          migrationTableExists: false,
          usersTableExists: false,
          userCount: 0,
          totalTables: 0,
        },
      });
    });
  });

  describe('testError', () => {
    it('should capture message and throw error', () => {
      expect(() => appController.testError()).toThrow(
        'This is a test error for Sentry',
      );
      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Test error endpoint called',
        'info',
      );
    });
  });

  describe('testSentry', () => {
    it('should capture message and return success', () => {
      const result = appController.testSentry();

      expect(result).toEqual({ message: 'Sentry test message sent' });
      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Test Sentry integration',
        'info',
      );
    });
  });
});
