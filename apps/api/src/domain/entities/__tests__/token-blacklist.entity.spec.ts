import {
  TokenBlacklistEntity,
  TokenType,
  BlacklistReason,
} from '../token-blacklist.entity';

describe('TokenBlacklistEntity', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJti = 'test-jti-123';
  const mockExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';

  describe('createForLogout', () => {
    it('should create entity for logout', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        mockExpiresAt,
        mockIpAddress,
        mockUserAgent,
      );

      expect(entity.getJti()).toBe(mockJti);
      expect(entity.getUserId()).toBe(mockUserId);
      expect(entity.getTokenType()).toBe(TokenType.ACCESS);
      expect(entity.getExpiresAt()).toEqual(mockExpiresAt);
      expect(entity.getReason()).toBe(BlacklistReason.LOGOUT);
      expect(entity.getIpAddress()).toBe(mockIpAddress);
      expect(entity.getUserAgent()).toBe(mockUserAgent);
      expect(entity.getBlacklistedAt()).toBeInstanceOf(Date);
    });

    it('should create entity without optional parameters', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.REFRESH,
        mockExpiresAt,
      );

      expect(entity.getJti()).toBe(mockJti);
      expect(entity.getUserId()).toBe(mockUserId);
      expect(entity.getTokenType()).toBe(TokenType.REFRESH);
      expect(entity.getExpiresAt()).toEqual(mockExpiresAt);
      expect(entity.getReason()).toBe(BlacklistReason.LOGOUT);
      expect(entity.getIpAddress()).toBeUndefined();
      expect(entity.getUserAgent()).toBeUndefined();
    });

    it('should validate JTI format', () => {
      expect(() => {
        TokenBlacklistEntity.createForLogout(
          '', // Empty JTI
          mockUserId,
          TokenType.ACCESS,
          mockExpiresAt,
        );
      }).toThrow('JTI cannot be empty');
    });

    it('should validate user ID format', () => {
      expect(() => {
        TokenBlacklistEntity.createForLogout(
          mockJti,
          'invalid-uuid', // Invalid UUID
          TokenType.ACCESS,
          mockExpiresAt,
        );
      }).toThrow('User ID must be a valid UUID');
    });

    it('should accept past expiration date', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      // Should not throw - tokens can be blacklisted after expiration
      expect(() => {
        TokenBlacklistEntity.createForLogout(
          mockJti,
          mockUserId,
          TokenType.ACCESS,
          pastDate,
        );
      }).not.toThrow();
    });
  });

  describe('createForSecurity', () => {
    it('should create entity for security breach', () => {
      const entity = TokenBlacklistEntity.createForSecurity(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        mockExpiresAt,
        BlacklistReason.SECURITY_BREACH,
        mockIpAddress,
        mockUserAgent,
      );

      expect(entity.getJti()).toBe(mockJti);
      expect(entity.getUserId()).toBe(mockUserId);
      expect(entity.getTokenType()).toBe(TokenType.ACCESS);
      expect(entity.getExpiresAt()).toEqual(mockExpiresAt);
      expect(entity.getReason()).toBe(BlacklistReason.SECURITY_BREACH);
      expect(entity.getIpAddress()).toBe(mockIpAddress);
      expect(entity.getUserAgent()).toBe(mockUserAgent);
    });

    it('should create entity for suspicious activity', () => {
      const entity = TokenBlacklistEntity.createForSecurity(
        mockJti,
        mockUserId,
        TokenType.REFRESH,
        mockExpiresAt,
        BlacklistReason.SUSPICIOUS_ACTIVITY,
      );

      expect(entity.getReason()).toBe(BlacklistReason.SUSPICIOUS_ACTIVITY);
    });
  });

  describe('fromDatabase', () => {
    it('should create entity from database data', () => {
      const dbData = {
        id: 'test-id',
        jti: mockJti,
        userId: mockUserId,
        tokenType: TokenType.ACCESS,
        blacklistedAt: new Date(),
        expiresAt: mockExpiresAt,
        reason: BlacklistReason.LOGOUT,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      };

      const entity = TokenBlacklistEntity.fromDatabase(dbData);

      expect(entity.getId()).toBe('test-id');
      expect(entity.getJti()).toBe(mockJti);
      expect(entity.getUserId()).toBe(mockUserId);
      expect(entity.getTokenType()).toBe(TokenType.ACCESS);
      expect(entity.getExpiresAt()).toEqual(mockExpiresAt);
      expect(entity.getReason()).toBe(BlacklistReason.LOGOUT);
      expect(entity.getIpAddress()).toBe(mockIpAddress);
      expect(entity.getUserAgent()).toBe(mockUserAgent);
    });

    it('should handle optional fields from database', () => {
      const dbData = {
        id: 'test-id',
        jti: mockJti,
        userId: mockUserId,
        tokenType: TokenType.REFRESH,
        blacklistedAt: new Date(),
        expiresAt: mockExpiresAt,
        reason: BlacklistReason.LOGOUT,
        ipAddress: null,
        userAgent: null,
      };

      const entity = TokenBlacklistEntity.fromDatabase(dbData);

      expect(entity.getIpAddress()).toBeUndefined();
      expect(entity.getUserAgent()).toBeUndefined();
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired token', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() + 3600000), // 1 hour from now
      );

      expect(entity.isExpired()).toBe(false);
    });

    it('should return true for expired token', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        new Date(Date.now() - 1000), // 1 second ago
      );

      expect(entity.isExpired()).toBe(true);
    });
  });

  describe('getDisplayInfo', () => {
    it('should return display info for access token', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        mockExpiresAt,
        mockIpAddress,
        mockUserAgent,
      );

      const displayInfo = entity.getDisplayInfo();

      expect(displayInfo).toContain('Access Token');
      expect(displayInfo).toContain('logout');
      // Display info doesn't include IP address - that's in the entity properties
    });

    it('should return display info for refresh token', () => {
      const entity = TokenBlacklistEntity.createForSecurity(
        mockJti,
        mockUserId,
        TokenType.REFRESH,
        mockExpiresAt,
        BlacklistReason.SECURITY_BREACH,
      );

      const displayInfo = entity.getDisplayInfo();

      expect(displayInfo).toContain('Refresh Token');
      expect(displayInfo).toContain('security breach');
    });

    it('should handle missing optional fields in display info', () => {
      const entity = TokenBlacklistEntity.createForLogout(
        mockJti,
        mockUserId,
        TokenType.ACCESS,
        mockExpiresAt,
      );

      const displayInfo = entity.getDisplayInfo();

      expect(displayInfo).toContain('Access Token');
      expect(displayInfo).toContain('logout');
      expect(displayInfo).not.toContain('from IP');
    });
  });

  // Note: Validation methods are private and tested indirectly through factory methods
  // Testing private methods directly is an anti-pattern and breaks encapsulation
});
