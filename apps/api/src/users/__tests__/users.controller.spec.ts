import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { User, NewUser } from '@/database/schema';
import { AbilitiesGuard } from '@/authorization/abilities.guard';
import { AbilitiesFactory } from '@/authorization/abilities.factory';
import { ValidationService } from '@/common/validation/validation.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'user-123',
    organizationId: 'org-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'pumper',
    phone: null,
    // Authentication fields
    passwordHash: null,
    emailVerified: false,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lockoutCount: 0,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    // System fields
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

  const mockUsersService = {
    createUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AbilitiesGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: AbilitiesFactory,
          useValue: {
            createForUser: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validate: jest.fn((schema: any, data: any) => data), // Return the validated data (second argument)
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(mockNewUser as any);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when service fails', async () => {
      const error = new Error('Database error');
      mockUsersService.createUser.mockRejectedValue(error);

      await expect(controller.createUser(mockNewUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle service throwing HttpException', async () => {
      const httpError = new HttpException(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
      );
      mockUsersService.createUser.mockRejectedValue(httpError);

      await expect(controller.createUser(mockNewUser as any)).rejects.toThrow(
        new HttpException(
          'Validation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should create user with minimal required fields', async () => {
      const minimalUser: NewUser = {
        organizationId: 'org-123',
        email: 'minimal@example.com',
        firstName: 'Minimal',
        lastName: 'User',
        role: 'pumper',
      };
      const createdUser = { ...mockUser, ...minimalUser };
      mockUsersService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(minimalUser as any);

      expect(result).toEqual(createdUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 2, email: 'user2@example.com' },
      ];
      mockUsersService.getAllUsers.mockResolvedValue(users);

      const result = await controller.getAllUsers();

      expect(result).toEqual(users);
      expect(mockUsersService.getAllUsers).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockUsersService.getAllUsers.mockResolvedValue([]);

      const result = await controller.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should throw error when service fails', async () => {
      const error = new Error('Database connection failed');
      mockUsersService.getAllUsers.mockRejectedValue(error);

      await expect(controller.getAllUsers()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      mockUsersService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.getUserById.mockResolvedValue(null);

      await expect(controller.getUserById('user-999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should re-throw HttpException from service', async () => {
      const httpError = new HttpException(
        'Database error',
        HttpStatus.BAD_REQUEST,
      );
      mockUsersService.getUserById.mockRejectedValue(httpError);

      await expect(controller.getUserById('user-123')).rejects.toThrow(
        httpError,
      );
    });

    it('should throw error for non-HttpException errors', async () => {
      const error = new Error('Unexpected error');
      mockUsersService.getUserById.mockRejectedValue(error);

      await expect(controller.getUserById('user-123')).rejects.toThrow(
        'Unexpected error',
      );
    });

    it('should handle large user ID', async () => {
      const largeId = 'user-999999999';
      mockUsersService.getUserById.mockResolvedValue(null);

      await expect(controller.getUserById(largeId)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(mockUsersService.getUserById).toHaveBeenCalledWith(largeId);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email successfully', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(mockUser);

      const result = await controller.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(null);

      await expect(
        controller.getUserByEmail('nonexistent@example.com'),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should re-throw HttpException from service', async () => {
      const httpError = new HttpException(
        'Invalid email format',
        HttpStatus.BAD_REQUEST,
      );
      mockUsersService.getUserByEmail.mockRejectedValue(httpError);

      await expect(controller.getUserByEmail('invalid-email')).rejects.toThrow(
        httpError,
      );
    });

    it('should throw error for non-HttpException errors', async () => {
      const error = new Error('Database timeout');
      mockUsersService.getUserByEmail.mockRejectedValue(error);

      await expect(
        controller.getUserByEmail('test@example.com'),
      ).rejects.toThrow('Database timeout');
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.com';
      const userWithSpecialEmail = { ...mockUser, email: specialEmail };
      mockUsersService.getUserByEmail.mockResolvedValue(userWithSpecialEmail);

      const result = await controller.getUserByEmail(specialEmail);

      expect(result).toEqual(userWithSpecialEmail);
      expect(mockUsersService.getUserByEmail).toHaveBeenCalledWith(
        specialEmail,
      );
    });
  });

  describe('updateUser', () => {
    const updateData: Partial<NewUser> = {
      firstName: 'Updated',
      lastName: 'User',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser('user-123', updateData as any);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        'user-123',
        updateData,
      );
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.updateUser.mockResolvedValue(null);

      await expect(
        controller.updateUser('user-999', updateData as any),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should re-throw HttpException from service', async () => {
      const httpError = new HttpException(
        'Validation failed',
        HttpStatus.BAD_REQUEST,
      );
      mockUsersService.updateUser.mockRejectedValue(httpError);

      await expect(
        controller.updateUser('user-123', updateData as any),
      ).rejects.toThrow(httpError);
    });

    it('should throw error for non-HttpException errors', async () => {
      const error = new Error('Update constraint violation');
      mockUsersService.updateUser.mockRejectedValue(error);

      await expect(
        controller.updateUser('user-123', updateData as any),
      ).rejects.toThrow('Update constraint violation');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, ...partialUpdate };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser('user-123', partialUpdate);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        'user-123',
        partialUpdate,
      );
    });

    it('should handle empty update data', async () => {
      const emptyUpdate = {};
      mockUsersService.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser('user-123', emptyUpdate);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        'user-123',
        emptyUpdate,
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUsersService.deleteUser.mockResolvedValue(true);

      const result = await controller.deleteUser('user-123');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockUsersService.deleteUser.mockResolvedValue(false);

      await expect(controller.deleteUser('user-999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should re-throw HttpException from service', async () => {
      const httpError = new HttpException(
        'Cannot delete user',
        HttpStatus.CONFLICT,
      );
      mockUsersService.deleteUser.mockRejectedValue(httpError);

      await expect(controller.deleteUser('user-123')).rejects.toThrow(
        httpError,
      );
    });

    it('should throw error for non-HttpException errors', async () => {
      const error = new Error('Foreign key constraint violation');
      mockUsersService.deleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser('user-123')).rejects.toThrow(
        'Foreign key constraint violation',
      );
    });

    it('should handle deletion of non-existent user', async () => {
      mockUsersService.deleteUser.mockResolvedValue(false);

      await expect(controller.deleteUser('user-0')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('user-0');
    });
  });
});
