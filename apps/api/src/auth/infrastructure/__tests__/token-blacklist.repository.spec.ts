import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistRepositoryImpl } from '../token-blacklist.repository';
import { DatabaseService } from '../../../database/database.service';
import {
  TokenBlacklistEntity,
  TokenType,
  BlacklistReason,
} from '../../../domain/entities/token-blacklist.entity';

describe('TokenBlacklistRepositoryImpl', () => {
  let repository: TokenBlacklistRepositoryImpl;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockDb: any;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJti = 'test-jti-123';

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      eq: jest.fn(),
      and: jest.fn(),
      lt: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<TokenBlacklistRepositoryImpl>(
      TokenBlacklistRepositoryImpl,
    );
  });

  describe('save', () => {
    it('should save a token blacklist entity', async () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() + 3600000), // 1 hour from now
        '192.168.1.1',
        'Mozilla/5.0',
      );

      // Mock the returning() method to return the expected data
      mockDb.returning.mockResolvedValue([
        {
          id: 'test-id',
          jti: mockJti,
          userId: mockUserId,
          tokenType: TokenType.ACCESS,
          blacklistedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          reason: 'logout',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      ]);

      const result = await repository.save(entity);

      expect(result).toBeInstanceOf(TokenBlacklistEntity);
      expect(result.getJti()).toBe(mockJti);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          jti: mockJti,
          userId: mockUserId,
          tokenType: TokenType.ACCESS,
          reason: BlacklistReason.LOGOUT,
        }),
      );
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() + 3600000),
        '192.168.1.1',
        'Mozilla/5.0',
      );

      mockDb.returning.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(entity)).rejects.toThrow('Database error');
    });
  });

  describe('findByJti', () => {
    it('should find entity by JTI', async () => {
      const mockDbResult = [
        {
          id: 'test-id',
          jti: mockJti,
          userId: mockUserId,
          tokenType: TokenType.ACCESS,
          blacklistedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          reason: BlacklistReason.LOGOUT,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      ];

      mockDb.execute.mockResolvedValue(mockDbResult);

      const result = await repository.findByJti(mockJti);

      expect(result).toBeInstanceOf(TokenBlacklistEntity);
      expect(result?.getJti()).toBe(mockJti);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return null when entity not found', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repository.findByJti('non-existent-jti');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      await expect(repository.findByJti(mockJti)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      mockDb.execute.mockResolvedValue([{ count: '1' }]);

      const result = await repository.isTokenBlacklisted(mockJti);

      expect(result).toBe(true);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return false for non-blacklisted token', async () => {
      mockDb.execute.mockResolvedValue([{ count: '0' }]);

      const result = await repository.isTokenBlacklisted(mockJti);

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      await expect(repository.isTokenBlacklisted(mockJti)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByUserId', () => {
    it('should find entities by user ID', async () => {
      const mockDbResult = [
        {
          id: 'test-id-1',
          jti: 'jti-1',
          userId: mockUserId,
          tokenType: TokenType.ACCESS,
          blacklistedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          reason: BlacklistReason.LOGOUT,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        {
          id: 'test-id-2',
          jti: 'jti-2',
          userId: mockUserId,
          tokenType: TokenType.REFRESH,
          blacklistedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          reason: BlacklistReason.LOGOUT,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      ];

      mockDb.execute.mockResolvedValue(mockDbResult);

      const result = await repository.findByUserId(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TokenBlacklistEntity);
      expect(result[1]).toBeInstanceOf(TokenBlacklistEntity);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when no entities found', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repository.findByUserId('non-existent-user');

      expect(result).toEqual([]);
    });
  });

  describe('deleteExpiredEntries', () => {
    it('should delete expired entries', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 5 });

      const result = await repository.deleteExpiredEntries();

      expect(result).toBe(5);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle case when no entries are deleted', async () => {
      mockDb.execute.mockResolvedValue({ rowCount: 0 });

      const result = await repository.deleteExpiredEntries();

      expect(result).toBe(0);
    });
  });
});
