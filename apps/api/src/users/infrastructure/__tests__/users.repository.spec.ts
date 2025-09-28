import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepositoryImpl } from '../users.repository';
import type { NewUser } from '../../../database/schema';
import type { UserRecord } from '../../../domain/users.repository';

// Create a mock query builder that supports chaining and is awaitable
const createMockQueryBuilder = (result: any = []) => {
  const methods = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(result),
  };

  // Create a promise that resolves to the result and has the query methods
  const promise = Promise.resolve(result);
  return Object.assign(promise, methods);
};

// Mock database connection
const createMockDb = () => {
  const mockQueryBuilder = createMockQueryBuilder();

  return {
    select: jest.fn(() => mockQueryBuilder),
    insert: jest.fn(() => mockQueryBuilder),
    update: jest.fn(() => mockQueryBuilder),
    delete: jest.fn(() => mockQueryBuilder),
  } as any; // Cast to any to avoid type issues with complex Drizzle types
};

describe('UsersRepositoryImpl', () => {
  let repository: UsersRepositoryImpl;
  let mockDb: any;

  const mockUser: UserRecord = {
    id: 'user-123',
    organizationId: 'org-456',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'pumper',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockNewUser: NewUser = {
    organizationId: 'org-456',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'pumper',
  };

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepositoryImpl,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<UsersRepositoryImpl>(UsersRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.create(mockNewUser);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle database errors during creation', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(repository.create(mockNewUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findById('user-123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await repository.findByEmail('test@example.com');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found by email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all users successfully', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, id: 'user-456', email: 'test2@example.com' },
      ];
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('update', () => {
    const updateData = { firstName: 'Jane' };
    const updatedUser = { ...mockUser, ...updateData };

    it('should update user successfully', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedUser]),
      });

      const result = await repository.update('user-123', updateData);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user not found for update', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.update('non-existent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      });

      const result = await repository.delete('user-123');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user not found for deletion', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });
});
