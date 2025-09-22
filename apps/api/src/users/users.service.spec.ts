import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { User, NewUser } from '../database/schema';

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: DatabaseService;
  let redisService: RedisService;

  const mockUser: User = {
    id: 'user-123',
    organizationId: 'org-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'pumper',
    phone: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockNewUser: NewUser = {
    organizationId: 'org-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'pumper',
  };

  // Mock database operations with proper chaining
  const mockInsert = jest.fn();
  const mockSelect = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockWhere = jest.fn();

  const mockDatabaseService = {
    getDb: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    })),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a complete mock database with proper chaining
    const mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      }),
    };

    // Override the database service to return our mock
    mockDatabaseService.getDb.mockReturnValue(mockDb);

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
    expect(databaseService).toBeDefined();
    expect(redisService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user and cache it', async () => {
      const result = await service.createUser(mockNewUser);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should handle database errors during user creation', async () => {
      const error = new Error('Database connection failed');

      // Override the default mock to throw error
      const mockDb = mockDatabaseService.getDb();
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(error),
        }),
      });

      await expect(service.createUser(mockNewUser)).rejects.toThrow(error);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should create user with minimal data', async () => {
      const minimalUser: NewUser = {
        organizationId: 'org-123',
        email: 'minimal@example.com',
        firstName: 'Minimal',
        lastName: 'User',
        role: 'pumper',
      };

      const createdUser = { ...mockUser, ...minimalUser };

      // Override the default mock to return created user with minimal data
      const mockDb = mockDatabaseService.getDb();
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdUser]),
        }),
      });

      const result = await service.createUser(minimalUser);

      expect(result).toEqual(createdUser);
    });
  });

  describe('getUserById', () => {
    it('should return user from cache if available', async () => {
      // When data comes from Redis, dates are serialized as strings
      const cachedUser = {
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserById('1');

      expect(result).toEqual(cachedUser);
      expect(mockRedisService.get).toHaveBeenCalledWith('user:1');
      expect(mockDatabaseService.getDb).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockRedisService.get).toHaveBeenCalledWith('user:1');
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should return null if user not found in database', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getUserById('999');

      expect(result).toBeNull();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle cache parsing errors gracefully', async () => {
      mockRedisService.get.mockResolvedValue('invalid-json');

      await expect(service.getUserById('1')).rejects.toThrow();
    });

    it('should handle database errors during user fetch', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const error = new Error('Database query failed');

      // Override the default mock to throw error
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      await expect(service.getUserById('1')).rejects.toThrow(error);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user from cache if available', async () => {
      const cacheKey = `user:email:${mockUser.email}`;
      // When data comes from Redis, dates are serialized as strings
      const cachedUser = {
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserByEmail(mockUser.email);

      expect(result).toEqual(cachedUser);
      expect(mockRedisService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockDatabaseService.getDb).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const cacheKey = `user:email:${mockUser.email}`;
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRedisService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should return null if user not found by email', async () => {
      const email = 'nonexistent@example.com';
      const cacheKey = `user:email:${email}`;
      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getUserByEmail(email);

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.com';
      const cacheKey = `user:email:${specialEmail}`;
      const userWithSpecialEmail = { ...mockUser, email: specialEmail };

      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return user with special email
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([userWithSpecialEmail]),
          }),
        }),
      });

      const result = await service.getUserByEmail(specialEmail);

      expect(result).toEqual(userWithSpecialEmail);
      expect(mockRedisService.get).toHaveBeenCalledWith(cacheKey);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users from database', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 2, email: 'user2@example.com' },
      ];

      // Override the default mock to return multiple users
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(users),
      });

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
    });

    it('should return empty array if no users exist', async () => {
      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should handle database errors during getAllUsers', async () => {
      const error = new Error('Database connection failed');

      // Override the default mock to throw error
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(error),
      });

      await expect(service.getAllUsers()).rejects.toThrow(error);
    });
  });

  describe('updateUser', () => {
    const updateData: Partial<NewUser> = {
      firstName: 'Updated',
      lastName: 'User',
    };

    it('should update user and refresh cache', async () => {
      const updatedUser = { ...mockUser, ...updateData, updatedAt: new Date() };

      // Override the default mock to return updated user
      const mockDb = mockDatabaseService.getDb();
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(updatedUser),
        3600,
      );
    });

    it('should update email and manage email cache', async () => {
      const emailUpdateData = { email: 'newemail@example.com' };
      const updatedUser = {
        ...mockUser,
        ...emailUpdateData,
        updatedAt: new Date(),
      };

      // Override the default mock to return updated user
      const mockDb = mockDatabaseService.getDb();
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await service.updateUser('1', emailUpdateData);

      expect(result).toEqual(updatedUser);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `user:email:${emailUpdateData.email}`,
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `user:email:${updatedUser.email}`,
        JSON.stringify(updatedUser),
        3600,
      );
    });

    it('should return null if user not found during update', async () => {
      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.updateUser('999', updateData);

      expect(result).toBeNull();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Update failed');

      // Override the default mock to throw error
      const mockDb = mockDatabaseService.getDb();
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      await expect(service.updateUser('1', updateData)).rejects.toThrow(error);
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      // Mock getUserById for deleteUser method
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
    });

    it('should delete user and clear cache', async () => {
      // Override the default mock to return rowCount: 1
      const mockDb = mockDatabaseService.getDb();
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      });

      const result = await service.deleteUser('1');

      expect(result).toBe(true);
      expect(service.getUserById).toHaveBeenCalledWith(1);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalledWith('user:1');
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
    });

    it('should return false if user not found during deletion', async () => {
      // Override the default mock to return rowCount: 0
      const mockDb = mockDatabaseService.getDb();
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      });

      const result = await service.deleteUser('999');

      expect(result).toBe(false);
      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it('should handle case where user not found in getUserById', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(null);
      mockWhere.mockResolvedValue({ rowCount: 1 });

      const result = await service.deleteUser('1');

      expect(result).toBe(true);
      expect(mockRedisService.del).toHaveBeenCalledWith('user:1');
      expect(mockRedisService.del).not.toHaveBeenCalledWith(
        expect.stringContaining('user:email:'),
      );
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Delete operation failed');

      // Override the default mock to throw error
      const mockDb = mockDatabaseService.getDb();
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockRejectedValue(error),
      });

      await expect(service.deleteUser('1')).rejects.toThrow(error);
    });

    it('should handle getUserById errors during deletion', async () => {
      const error = new Error('Failed to get user');
      jest.spyOn(service, 'getUserById').mockRejectedValue(error);

      await expect(service.deleteUser('1')).rejects.toThrow(error);
    });
  });

  describe('Redis integration scenarios', () => {
    it('should handle Redis connection failures gracefully', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedisService.get.mockRejectedValue(redisError);

      await expect(service.getUserById('1')).rejects.toThrow(redisError);
    });

    it('should handle Redis set failures during user creation', async () => {
      const redisError = new Error('Redis set failed');
      mockRedisService.set.mockRejectedValue(redisError);

      await expect(service.createUser(mockNewUser)).rejects.toThrow(redisError);
    });

    it('should handle Redis operations with null values', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
      mockRedisService.del.mockResolvedValue(1);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(mockRedisService.get).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty string email in getUserByEmail', async () => {
      await service.getUserByEmail('');

      expect(mockRedisService.get).toHaveBeenCalledWith('user:email:');
    });

    it('should handle negative user ID in getUserById', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getUserById('-1');

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith('user:-1');
    });

    it('should handle zero user ID in getUserById', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getUserById('0');

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith('user:0');
    });

    it('should handle large user ID in getUserById', async () => {
      const largeId = '999999999';
      mockRedisService.get.mockResolvedValue(null);

      // Override the default mock to return empty array
      const mockDb = mockDatabaseService.getDb();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getUserById(largeId);

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith(`user:${largeId}`);
    });
  });
});
