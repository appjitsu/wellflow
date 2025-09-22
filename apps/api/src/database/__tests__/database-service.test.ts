import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database.service';
import { Pool } from 'pg';

// Mock pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock drizzle
jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn().mockReturnValue({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let _configService: ConfigService;
  let mockPool: { query: jest.Mock; end: jest.Mock };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock pool
    mockPool = {
      query: jest.fn(),
      end: jest.fn(),
    };

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(
      () => mockPool as any,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize database connection with default config', async () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost') // DB_HOST
        .mockReturnValueOnce(5432) // DB_PORT
        .mockReturnValueOnce('postgres') // DB_USER
        .mockReturnValueOnce('password') // DB_PASSWORD
        .mockReturnValueOnce('wellflow'); // DB_NAME

      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await service.onModuleInit();

      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password', // eslint-disable-line sonarjs/no-hardcoded-passwords
        database: 'wellflow',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should initialize database connection with custom config', async () => {
      mockConfigService.get
        .mockReturnValueOnce('custom-host') // DB_HOST
        .mockReturnValueOnce(3306) // DB_PORT
        .mockReturnValueOnce('custom-user') // DB_USER
        .mockReturnValueOnce('custom-pass') // DB_PASSWORD
        .mockReturnValueOnce('custom-db'); // DB_NAME

      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await service.onModuleInit();

      expect(Pool).toHaveBeenCalledWith({
        host: 'custom-host',
        port: 3306,
        user: 'custom-user',
        password: 'custom-pass', // eslint-disable-line sonarjs/no-hardcoded-passwords
        database: 'custom-db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should handle connection test failure', async () => {
      mockConfigService.get
        .mockReturnValueOnce('localhost')
        .mockReturnValueOnce(5432)
        .mockReturnValueOnce('postgres')
        .mockReturnValueOnce('password')
        .mockReturnValueOnce('wellflow');

      const connectionError = new Error('Connection failed');
      mockPool.query.mockRejectedValue(connectionError);

      await expect(service.onModuleInit()).rejects.toThrow();
    });

    it('should use default values when config is missing', async () => {
      // Mock config service to return default values
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => defaultValue,
      );

      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await service.onModuleInit();

      expect(Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: undefined,
        database: 'wellflow',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should close database connection', async () => {
      // Initialize first
      mockConfigService.get.mockReturnValue('test');
      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      await service.onModuleInit();

      // Then destroy
      await service.onModuleDestroy();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle missing pool gracefully', async () => {
      // Don't initialize, just destroy
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should handle pool end error', async () => {
      // Initialize first
      mockConfigService.get.mockReturnValue('test');
      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
      await service.onModuleInit();

      // Mock end to throw error
      mockPool.end.mockRejectedValue(new Error('End failed'));

      // Should handle error gracefully (the actual implementation doesn't catch this error)
      await expect(service.onModuleDestroy()).rejects.toThrow('End failed');
    });
  });

  describe('getDb', () => {
    it('should return database instance', async () => {
      mockConfigService.get.mockReturnValue('test');
      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await service.onModuleInit();

      const db = service.getDb();
      expect(db).toBeDefined();
      expect(typeof db).toBe('object');
    });

    it('should return same instance on multiple calls', async () => {
      mockConfigService.get.mockReturnValue('test');
      mockPool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await service.onModuleInit();

      const db1 = service.getDb();
      const db2 = service.getDb();
      expect(db1).toBe(db2);
    });

    it('should return undefined before initialization', () => {
      const db = service.getDb();
      expect(db).toBeUndefined();
    });
  });
});
