import { PasswordHistoryRepositoryImpl } from '../password-history.repository';
import { PasswordHistory } from '../../../domain/entities/password-history.entity';
import { DatabaseService } from '../../../database/database.service';
import { randomUUID } from 'crypto';

/**
 * Unit Tests for PasswordHistoryRepository
 *
 * Tests the password history repository implementation including
 * CRUD operations, history management, and database interactions.
 */
describe('PasswordHistoryRepository', () => {
  let repository: PasswordHistoryRepositoryImpl;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockDb: any;

  const validUserId = randomUUID();
  const validPasswordHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe';

  beforeEach(() => {
    // Mock database operations
    mockDb = {
      select: jest.fn(() => mockDb),
      from: jest.fn(() => mockDb),
      where: jest.fn(() => mockDb),
      orderBy: jest.fn(() => mockDb),
      limit: jest.fn(() => Promise.resolve([])), // Return a promise that resolves to array
      insert: jest.fn(() => mockDb),
      values: jest.fn(() => mockDb),
      returning: jest.fn(() => mockDb),
      delete: jest.fn(() => mockDb),
      execute: jest.fn(() => Promise.resolve([])),
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    } as any;

    repository = new PasswordHistoryRepositoryImpl(mockDatabaseService);
  });

  describe('findByUserId', () => {
    it('should return password history for user ordered by creation date', async () => {
      const mockHistoryData = [
        {
          id: randomUUID(),
          userId: validUserId,
          passwordHash:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: randomUUID(),
          userId: validUserId,
          passwordHash:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pf',
          createdAt: new Date('2024-01-14T10:00:00Z'),
        },
      ];

      // Mock the limit method to return the data
      mockDb.limit.mockResolvedValueOnce(mockHistoryData);

      const result = await repository.findByUserId(validUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PasswordHistory);
      if (result[0]) {
        expect(result[0].getUserId()).toBe(validUserId);
      }
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });

    it('should return empty array when no history exists', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repository.findByUserId(validUserId);

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockDb.limit.mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      await expect(repository.findByUserId(validUserId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getPasswordHashesByUserId', () => {
    it('should return recent password hashes limited to specified count', async () => {
      const mockHashes = [
        {
          passwordHash:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
        },
        {
          passwordHash:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pf',
        },
        {
          passwordHash:
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pg',
        },
      ];

      mockDb.limit.mockResolvedValueOnce(mockHashes);

      const result = await repository.getPasswordHashesByUserId(validUserId, 3);

      expect(result).toEqual([
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pf',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pg',
      ]);
      expect(mockDb.limit).toHaveBeenCalledWith(3);
    });

    it('should default to 5 recent hashes when count not specified', async () => {
      const mockHashes = Array(5)
        .fill(null)
        .map((_, i) => ({
          passwordHash: `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1P${String.fromCharCode(101 + i)}`,
        }));

      mockDb.limit.mockResolvedValueOnce(mockHashes);

      const result = await repository.getPasswordHashesByUserId(validUserId);

      expect(result).toHaveLength(5);
      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });

    it('should return empty array when no history exists', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repository.getPasswordHashesByUserId(validUserId);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should save new password history entry', async () => {
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );
      const mockInsertResult = [
        {
          id: passwordHistory.getId(),
          userId: validUserId,
          passwordHash: validPasswordHash,
          createdAt: passwordHistory.getCreatedAt(),
        },
      ];

      mockDb.execute.mockResolvedValue(mockInsertResult);

      const result = await repository.save(passwordHistory);

      expect(result).toBeInstanceOf(PasswordHistory);
      expect(result.getId()).toBe(passwordHistory.getId());
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        id: passwordHistory.getId(),
        userId: validUserId,
        passwordHash: validPasswordHash,
        createdAt: passwordHistory.getCreatedAt(),
      });
    });

    it('should handle database insertion errors', async () => {
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );
      mockDb.execute.mockRejectedValue(
        new Error('Unique constraint violation'),
      );

      await expect(repository.save(passwordHistory)).rejects.toThrow(
        'Unique constraint violation',
      );
    });
  });

  describe('cleanupOldEntries', () => {
    it('should delete entries older than specified count for user', async () => {
      // Mock finding entries (more than keep count)
      const mockEntries = [
        { id: 'id1' },
        { id: 'id2' },
        { id: 'id3' },
        { id: 'id4' },
        { id: 'id5' },
        { id: 'id6' }, // This should be deleted
        { id: 'id7' }, // This should be deleted
      ];
      mockDb.execute
        .mockResolvedValueOnce(mockEntries) // First call returns all entries
        .mockResolvedValueOnce([]); // Second call performs deletion

      await repository.cleanupOldEntries(validUserId, 5);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      // Mock finding entries
      const mockEntries = [
        { id: 'id1' },
        { id: 'id2' },
        { id: 'id3' },
        { id: 'id4' },
        { id: 'id5' },
        { id: 'id6' },
      ];
      mockDb.execute
        .mockResolvedValueOnce(mockEntries) // First call returns entries
        .mockRejectedValueOnce(new Error('Delete operation failed')); // Second call fails

      await expect(
        repository.cleanupOldEntries(validUserId, 5),
      ).rejects.toThrow('Delete operation failed');
    });
  });

  describe('cleanup', () => {
    it('should maintain only the specified number of recent entries', async () => {
      // Mock finding entries (more than keep count)
      const mockEntries = [
        { id: 'id1' },
        { id: 'id2' },
        { id: 'id3' },
        { id: 'id4' },
        { id: 'id5' },
        { id: 'id6' }, // This should be deleted
        { id: 'id7' }, // This should be deleted
      ];

      mockDb.execute
        .mockResolvedValueOnce(mockEntries) // First call returns all entries
        .mockResolvedValueOnce([]); // Second call performs deletion

      await repository.cleanupOldEntries(validUserId, 5);

      expect(mockDb.execute).toHaveBeenCalledTimes(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should not delete anything when under the limit', async () => {
      // Mock finding entries (under the limit)
      const mockEntries = [{ id: 'id1' }, { id: 'id2' }, { id: 'id3' }];

      mockDb.execute.mockResolvedValueOnce(mockEntries); // Returns entries under limit

      await repository.cleanupOldEntries(validUserId, 5);

      expect(mockDb.execute).toHaveBeenCalledTimes(1);
      expect(mockDb.delete).not.toHaveBeenCalled(); // Delete should not be called
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete password history lifecycle', async () => {
      // Create new entry
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );

      mockDb.execute
        .mockResolvedValueOnce([
          {
            // Save operation
            id: passwordHistory.getId(),
            userId: validUserId,
            passwordHash: validPasswordHash,
            createdAt: passwordHistory.getCreatedAt(),
          },
        ])
        .mockResolvedValueOnce([{ id: 'old-entry-id' }]) // Cleanup select finds entries
        .mockResolvedValueOnce([]); // Cleanup delete succeeds

      mockDb.limit.mockResolvedValueOnce([{ passwordHash: validPasswordHash }]); // Get recent hashes

      // Save new entry
      const saved = await repository.save(passwordHistory);
      expect(saved).toBeInstanceOf(PasswordHistory);

      // Get recent hashes
      const hashes = await repository.getPasswordHashesByUserId(validUserId, 1);
      expect(hashes).toContain(validPasswordHash);

      // Cleanup old entries
      await repository.cleanupOldEntries(validUserId, 5);

      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent operations safely', async () => {
      const passwordHistory1 = PasswordHistory.create(
        validUserId,
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
      );
      const passwordHistory2 = PasswordHistory.create(
        validUserId,
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pf',
      );

      mockDb.execute
        .mockResolvedValueOnce([
          {
            id: passwordHistory1.getId(),
            userId: validUserId,
            passwordHash:
              '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
            createdAt: passwordHistory1.getCreatedAt(),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: passwordHistory2.getId(),
            userId: validUserId,
            passwordHash:
              '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pf',
            createdAt: passwordHistory2.getCreatedAt(),
          },
        ]);

      // Simulate concurrent saves
      const [result1, result2] = await Promise.all([
        repository.save(passwordHistory1),
        repository.save(passwordHistory2),
      ]);

      expect(result1).toBeInstanceOf(PasswordHistory);
      expect(result2).toBeInstanceOf(PasswordHistory);
      expect(result1.getId()).not.toBe(result2.getId());
    });
  });

  describe('data validation', () => {
    it('should validate entity before saving', () => {
      // The entity constructor should throw before we even get to the repository
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new PasswordHistory(
          randomUUID(),
          'invalid-user-id',
          validPasswordHash,
          new Date(),
        );
      }).toThrow('User ID must be a valid UUID');
    });

    it('should handle malformed database responses', async () => {
      const malformedData = [
        {
          id: 'not-a-uuid',
          userId: validUserId,
          passwordHash: validPasswordHash,
          createdAt: 'not-a-date',
        },
      ];

      mockDb.limit.mockResolvedValueOnce(malformedData);

      await expect(repository.findByUserId(validUserId)).rejects.toThrow();
    });
  });
});
