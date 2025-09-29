import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from '../token-blacklist.service';
import { TokenBlacklistRepository } from '../../../domain/repositories/token-blacklist.repository.interface';
import { AuditLogService } from '../../../application/services/audit-log.service';
import {
  TokenBlacklistEntity,
  TokenType,
  BlacklistReason,
} from '../../../domain/entities/token-blacklist.entity';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let mockRepository: jest.Mocked<TokenBlacklistRepository>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockAuditLogService: jest.Mocked<AuditLogService>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJti = 'test-jti-123';
  const mockToken = 'test.jwt.token-for-unit-testing-only';

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findByJti: jest.fn(),
      isTokenBlacklisted: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndTokenType: jest.fn(),
      deleteExpiredEntries: jest.fn(),
      deleteByUserId: jest.fn(),
      count: jest.fn(),
      countByUserId: jest.fn(),
    };

    mockJwtService = {
      decode: jest.fn(),
      verify: jest.fn(),
    } as any;

    mockAuditLogService = {
      logSuccess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: 'TokenBlacklistRepository',
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  describe('blacklistToken', () => {
    it('should successfully blacklist a token', async () => {
      const mockDecodedToken = {
        jti: mockJti,
        sub: mockUserId,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };

      mockJwtService.decode.mockReturnValue(mockDecodedToken);
      const mockEntity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() + 3600000),
      );
      mockRepository.save.mockResolvedValue(mockEntity);

      await service.blacklistToken(
        mockToken,
        TokenType.ACCESS,
        BlacklistReason.LOGOUT,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockJwtService.decode).toHaveBeenCalledWith(mockToken);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(TokenBlacklistEntity),
      );
      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        expect.any(String), // AuditAction
        expect.any(String), // AuditResourceType
        mockUserId,
        expect.any(Object), // changes
        expect.objectContaining({
          businessContext: expect.objectContaining({
            action: 'token_blacklisted',
            tokenType: TokenType.ACCESS,
            reason: BlacklistReason.LOGOUT,
          }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('should handle invalid token gracefully', async () => {
      mockJwtService.decode.mockReturnValue(null);

      // Should not throw, just log and return
      await service.blacklistToken(
        'invalid-token',
        TokenType.ACCESS,
        BlacklistReason.LOGOUT,
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockAuditLogService.logSuccess).not.toHaveBeenCalled();
    });

    it('should handle token without JTI by generating one', async () => {
      const mockDecodedToken = {
        sub: mockUserId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        // No jti field
      };

      mockJwtService.decode.mockReturnValue(mockDecodedToken);
      const mockEntity = TokenBlacklistEntity.createForLogout(
        'generated-jti',
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() + 3600000),
      );
      mockRepository.save.mockResolvedValue(mockEntity);

      // Should not throw, should generate JTI and proceed
      await service.blacklistToken(
        mockToken,
        TokenType.ACCESS,
        BlacklistReason.LOGOUT,
      );

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle expired token gracefully', async () => {
      const mockDecodedToken = {
        jti: mockJti,
        sub: mockUserId,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };

      mockJwtService.decode.mockReturnValue(mockDecodedToken);

      // Should not throw, should handle gracefully
      await service.blacklistToken(
        mockToken,
        TokenType.ACCESS,
        BlacklistReason.LOGOUT,
      );

      // Should still save the blacklist entry even for expired tokens
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      const mockDecodedToken = {
        jti: mockJti,
        sub: mockUserId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.decode.mockReturnValue(mockDecodedToken);
      mockRepository.isTokenBlacklisted.mockResolvedValue(true);

      const result = await service.isTokenBlacklisted(mockToken);

      expect(result).toBe(true);
      expect(mockRepository.isTokenBlacklisted).toHaveBeenCalledWith(mockJti);
    });

    it('should return false for non-blacklisted token', async () => {
      const mockDecodedToken = {
        jti: mockJti,
        sub: mockUserId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.decode.mockReturnValue(mockDecodedToken);
      mockRepository.isTokenBlacklisted.mockResolvedValue(false);

      const result = await service.isTokenBlacklisted(mockToken);

      expect(result).toBe(false);
      expect(mockRepository.isTokenBlacklisted).toHaveBeenCalledWith(mockJti);
    });

    it('should return false for invalid token', async () => {
      mockJwtService.decode.mockReturnValue(null);

      const result = await service.isTokenBlacklisted('invalid-token');

      expect(result).toBe(false);
      expect(mockRepository.isTokenBlacklisted).not.toHaveBeenCalled();
    });
  });

  describe('blacklistAllUserTokens', () => {
    it('should blacklist all user tokens', async () => {
      // This method doesn't return a count in the current implementation
      await service.blacklistAllUserTokens(
        mockUserId,
        BlacklistReason.SECURITY_BREACH,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        expect.any(String), // AuditAction
        expect.any(String), // AuditResourceType
        mockUserId,
        expect.any(Object), // changes
        expect.objectContaining({
          businessContext: expect.objectContaining({
            action: 'all_tokens_blacklisted',
            reason: BlacklistReason.SECURITY_BREACH,
          }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should cleanup expired entries', async () => {
      mockRepository.deleteExpiredEntries.mockResolvedValue(5);

      const result = await service.cleanupExpiredEntries();

      expect(result).toBe(5);
      expect(mockRepository.deleteExpiredEntries).toHaveBeenCalled();
    });
  });
});
