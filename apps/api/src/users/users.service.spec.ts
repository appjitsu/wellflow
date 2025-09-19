import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: DatabaseService;
  let redisService: RedisService;

  const mockDatabaseService = {
    getDb: jest.fn(() => ({
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([
            {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        })),
      })),
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue([
              {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          })),
        })),
      })),
    })),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user and cache it', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `user:${result.id}`,
        JSON.stringify(result),
        3600
      );
    });
  });

  describe('getUserById', () => {
    it('should return user from cache if available', async () => {
      const cachedUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2025-09-19T03:05:06.631Z',
        updatedAt: '2025-09-19T03:05:06.631Z',
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserById(1);

      expect(result).toEqual(cachedUser);
      expect(mockRedisService.get).toHaveBeenCalledWith('user:1');
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getUserById(1);

      expect(result).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });
});
