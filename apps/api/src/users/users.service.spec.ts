import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './domain/users.repository';
import { RedisService } from '../redis/redis.service';
import { NewUser } from '../database/schema';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let redisService: RedisService;

  const mockUser = {
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

  beforeEach(async () => {
    const mockUsersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'UsersRepository',
          useValue: mockUsersRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get('UsersRepository');
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersRepository).toBeDefined();
    expect(redisService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user and cache it', async () => {
      usersRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser(mockNewUser);

      expect(result).toEqual(mockUser);
      expect(usersRepository.create).toHaveBeenCalledWith(mockNewUser);
      expect(redisService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should handle database errors during user creation', async () => {
      const error = new Error('Database connection failed');
      usersRepository.create.mockRejectedValue(error);

      await expect(service.createUser(mockNewUser)).rejects.toThrow(error);
      expect(redisService.set).not.toHaveBeenCalled();
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
      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.createUser(minimalUser);

      expect(result).toEqual(createdUser);
      expect(usersRepository.create).toHaveBeenCalledWith(minimalUser);
    });

    it('should throw error when user creation returns empty result', async () => {
      usersRepository.create.mockResolvedValue(null as any);

      await expect(service.createUser(mockNewUser)).rejects.toThrow(
        'Failed to create user',
      );
      expect(usersRepository.create).toHaveBeenCalledWith(mockNewUser);
    });

    it('should handle Redis caching errors gracefully', async () => {
      usersRepository.create.mockResolvedValue(mockUser);
      redisService.set = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.createUser(mockNewUser);

      expect(result).toEqual(mockUser);
      expect(usersRepository.create).toHaveBeenCalledWith(mockNewUser);
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
      redisService.get = jest
        .fn()
        .mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserById('1');

      expect(result).toEqual(cachedUser);
      expect(redisService.get).toHaveBeenCalledWith('user:1');
      expect(usersRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(redisService.get).toHaveBeenCalledWith('user:1');
      expect(usersRepository.findById).toHaveBeenCalledWith('1');
      expect(redisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should return null if user not found in database', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById('999');

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith('user:999');
      expect(usersRepository.findById).toHaveBeenCalledWith('999');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle cache parsing errors gracefully', async () => {
      redisService.get = jest.fn().mockResolvedValue('invalid-json');
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(redisService.get).toHaveBeenCalledWith('user:1');
      expect(usersRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should handle database errors during user fetch', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      const error = new Error('Database query failed');
      usersRepository.findById.mockRejectedValue(error);

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
      redisService.get = jest
        .fn()
        .mockResolvedValue(JSON.stringify(cachedUser));

      const result = await service.getUserByEmail(mockUser.email);

      expect(result).toEqual(cachedUser);
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(usersRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      const cacheKey = `user:email:${mockUser.email}`;
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(redisService.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockUser),
        3600,
      );
    });

    it('should return null if user not found by email', async () => {
      const email = 'nonexistent@example.com';
      const cacheKey = `user:email:${email}`;
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.getUserByEmail(email);

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.com';
      const cacheKey = `user:email:${specialEmail}`;
      const userWithSpecialEmail = { ...mockUser, email: specialEmail };

      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findByEmail.mockResolvedValue(userWithSpecialEmail);

      const result = await service.getUserByEmail(specialEmail);

      expect(result).toEqual(userWithSpecialEmail);
      expect(redisService.get).toHaveBeenCalledWith(cacheKey);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(specialEmail);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users from database', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@example.com' },
      ];

      usersRepository.findAll.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(usersRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array if no users exist', async () => {
      usersRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
      expect(usersRepository.findAll).toHaveBeenCalled();
    });

    it('should handle database errors during getAllUsers', async () => {
      const error = new Error('Database connection failed');
      usersRepository.findAll.mockRejectedValue(error);

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
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(redisService.set).toHaveBeenCalledWith(
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
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', emailUpdateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith('1', emailUpdateData);
      expect(redisService.del).toHaveBeenCalledWith(
        `user:email:${emailUpdateData.email}`,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `user:email:${updatedUser.email}`,
        JSON.stringify(updatedUser),
        3600,
      );
    });

    it('should return null if user not found during update', async () => {
      usersRepository.update.mockResolvedValue(null);

      const result = await service.updateUser('999', updateData);

      expect(result).toBeNull();
      expect(usersRepository.update).toHaveBeenCalledWith('999', updateData);
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Update failed');
      usersRepository.update.mockRejectedValue(error);

      await expect(service.updateUser('1', updateData)).rejects.toThrow(error);
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      // Mock getUserById for deleteUser method
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
    });

    it('should delete user and clear cache', async () => {
      usersRepository.delete.mockResolvedValue(true);

      const result = await service.deleteUser('1');

      expect(result).toBe(true);
      expect(service.getUserById).toHaveBeenCalledWith('1');
      expect(usersRepository.delete).toHaveBeenCalledWith('1');
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(redisService.del).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
    });

    it('should return false if user not found during deletion', async () => {
      usersRepository.delete.mockResolvedValue(false);

      const result = await service.deleteUser('999');

      expect(result).toBe(false);
      expect(service.getUserById).toHaveBeenCalledWith('999');
      expect(usersRepository.delete).toHaveBeenCalledWith('999');
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should handle case where user not found in getUserById', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(null);
      usersRepository.delete.mockResolvedValue(true);

      const result = await service.deleteUser('1');

      expect(result).toBe(true);
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(redisService.del).not.toHaveBeenCalledWith(
        expect.stringContaining('user:email:'),
      );
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Delete operation failed');
      usersRepository.delete.mockRejectedValue(error);

      await expect(service.deleteUser('1')).rejects.toThrow(
        'Failed to delete user',
      );
    });

    it('should handle getUserById errors during deletion', async () => {
      const error = new Error('Failed to get user');
      jest.spyOn(service, 'getUserById').mockRejectedValue(error);

      await expect(service.deleteUser('1')).rejects.toThrow(
        'Failed to delete user',
      );
    });
  });

  describe('Redis integration scenarios', () => {
    it('should handle Redis connection failures gracefully', async () => {
      const redisError = new Error('Redis connection failed');
      redisService.get = jest.fn().mockRejectedValue(redisError);
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(usersRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should handle Redis set failures during user creation', async () => {
      const redisError = new Error('Redis set failed');
      redisService.set = jest.fn().mockRejectedValue(redisError);
      usersRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser(mockNewUser);

      expect(result).toEqual(mockUser);
      expect(usersRepository.create).toHaveBeenCalledWith(mockNewUser);
    });

    it('should handle Redis operations with null values', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      redisService.set = jest.fn().mockResolvedValue('OK');
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(redisService.get).toHaveBeenCalledWith('user:1');
      expect(redisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(mockUser),
        3600,
      );
      expect(usersRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty string email in getUserByEmail', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findByEmail.mockResolvedValue(null);

      await service.getUserByEmail('');

      expect(redisService.get).toHaveBeenCalledWith('user:email:');
      expect(usersRepository.findByEmail).toHaveBeenCalledWith('');
    });

    it('should handle negative user ID in getUserById', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById('-1');

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith('user:-1');
      expect(usersRepository.findById).toHaveBeenCalledWith('-1');
    });

    it('should handle zero user ID in getUserById', async () => {
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById('0');

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith('user:0');
      expect(usersRepository.findById).toHaveBeenCalledWith('0');
    });

    it('should handle large user ID in getUserById', async () => {
      const largeId = '999999999';
      redisService.get = jest.fn().mockResolvedValue(null);
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById(largeId);

      expect(result).toBeNull();
      expect(redisService.get).toHaveBeenCalledWith(`user:${largeId}`);
      expect(usersRepository.findById).toHaveBeenCalledWith(largeId);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users from database', async () => {
      const allUsers = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@example.com' },
      ];

      usersRepository.findAll.mockResolvedValue(allUsers);

      const result = await service.getAllUsers();

      expect(result).toEqual(allUsers);
      expect(usersRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      usersRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
      expect(usersRepository.findAll).toHaveBeenCalled();
    });

    it('should handle database errors in getAllUsers', async () => {
      usersRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllUsers()).rejects.toThrow('Database error');
    });
  });

  describe('updateUser', () => {
    it('should update user and cache', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData };

      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(redisService.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(updatedUser),
        3600,
      );
    });

    it('should update email and handle email cache', async () => {
      const updateData = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, ...updateData };

      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.update).toHaveBeenCalledWith('1', updateData);
      expect(redisService.del).toHaveBeenCalledWith(
        'user:email:newemail@example.com',
      );
      expect(redisService.set).toHaveBeenCalledWith(
        'user:email:newemail@example.com',
        JSON.stringify(updatedUser),
        3600,
      );
    });

    it('should return null when user not found for update', async () => {
      usersRepository.update.mockResolvedValue(null);

      const result = await service.updateUser('999', { firstName: 'Test' });

      expect(result).toBeNull();
      expect(usersRepository.update).toHaveBeenCalledWith('999', {
        firstName: 'Test',
      });
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and clear cache', async () => {
      // Mock getUserById to return user for cache clearing
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(true);

      const result = await service.deleteUser('1');

      expect(result).toBe(true);
      expect(usersRepository.delete).toHaveBeenCalledWith('1');
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(redisService.del).toHaveBeenCalledWith(
        `user:email:${mockUser.email}`,
      );
    });

    it('should return false when user not found for deletion', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(null);
      usersRepository.delete.mockResolvedValue(false);

      const result = await service.deleteUser('999');

      expect(result).toBe(false);
      expect(usersRepository.delete).toHaveBeenCalledWith('999');
      // Redis del should NOT be called when deletion fails
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should handle deletion when rowCount is undefined', async () => {
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(false);

      const result = await service.deleteUser('1');

      expect(result).toBe(false);
      expect(usersRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
