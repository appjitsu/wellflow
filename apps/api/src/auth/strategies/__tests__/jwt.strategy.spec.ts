import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../jwt.strategy';
import { AuthService } from '../../auth.service';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';

/**
 * Unit Tests for JwtStrategy
 *
 * Tests the JWT authentication strategy implementation
 * following the established Strategy pattern used throughout the codebase.
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockAuthService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockAuthService = {
      validateUserById: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') {
          return 'test-secret-key-for-development';
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate JWT payload and return authenticated user', async () => {
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        true,
      );

      mockAuthService.validateUserById.mockResolvedValue(testUser);

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: UserRole.MANAGER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: UserRole.MANAGER,
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        lastLoginAt: undefined,
      });

      expect(mockAuthService.validateUserById).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockAuthService.validateUserById.mockResolvedValue(null);

      const payload = {
        sub: 'non-existent-user',
        email: 'nonexistent@example.com',
        organizationId: 'org-456',
        role: UserRole.MANAGER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateUserById).toHaveBeenCalledWith(
        'non-existent-user',
      );
    });

    it('should return user data even for unverified email (JWT already issued)', async () => {
      const unverifiedUser = new User(
        'user-123',
        'org-456',
        Email.create('unverified@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        false, // Email not verified
      );

      mockAuthService.validateUserById.mockResolvedValue(unverifiedUser);

      const payload = {
        sub: 'user-123',
        email: 'unverified@example.com',
        organizationId: 'org-456',
        role: UserRole.MANAGER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);
      expect(result.isEmailVerified).toBe(false);
      expect(result.id).toBe('user-123');
    });

    it('should handle different user roles correctly', async () => {
      const testCases = [
        { role: UserRole.OWNER, email: 'owner@example.com' },
        { role: UserRole.MANAGER, email: 'manager@example.com' },
        { role: UserRole.PUMPER, email: 'pumper@example.com' },
      ];

      for (const testCase of testCases) {
        const testUser = new User(
          `user-${testCase.role}`,
          'org-456',
          Email.create(testCase.email),
          'Test',
          'User',
          testCase.role,
          '+1234567890',
          'hashed-password',
          true,
        );

        mockAuthService.validateUserById.mockResolvedValue(testUser);

        const payload = {
          sub: `user-${testCase.role}`,
          email: testCase.email,
          organizationId: 'org-456',
          role: testCase.role as string,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };

        const result = await strategy.validate(payload);

        expect(result.role).toBe(testCase.role);
        expect(result.id).toBe(`user-${testCase.role}`);

        jest.clearAllMocks();
      }
    });

    it('should validate organization context', async () => {
      const testUser = new User(
        'user-123',
        'org-specific',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        true,
      );

      mockAuthService.validateUserById.mockResolvedValue(testUser);

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-specific',
        role: UserRole.MANAGER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result.organizationId).toBe('org-specific');
    });

    it('should handle service errors gracefully', async () => {
      mockAuthService.validateUserById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: UserRole.MANAGER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('strategy configuration', () => {
    it('should be properly configured with JWT secret', () => {
      expect(strategy).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should extend PassportStrategy correctly', () => {
      expect(strategy).toBeInstanceOf(JwtStrategy);
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should handle pumper user authentication', async () => {
      const pumperUser = new User(
        'pumper-123',
        'oil-company-456',
        Email.create('pumper@oilcompany.com'),
        'Oil',
        'Pumper',
        UserRole.PUMPER,
        '+1234567890',
        'hashed-password',
        true,
      );

      mockAuthService.validateUserById.mockResolvedValue(pumperUser);

      const payload = {
        sub: 'pumper-123',
        email: 'pumper@oilcompany.com',
        organizationId: 'oil-company-456',
        role: UserRole.PUMPER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.PUMPER);
      expect(result.organizationId).toBe('oil-company-456');
    });

    it('should handle owner user authentication', async () => {
      const ownerUser = new User(
        'owner-123',
        'oil-company-789',
        Email.create('owner@oilcompany.com'),
        'Company',
        'Owner',
        UserRole.OWNER,
        '+1234567890',
        'hashed-password',
        true,
      );

      mockAuthService.validateUserById.mockResolvedValue(ownerUser);

      const payload = {
        sub: 'owner-123',
        email: 'owner@oilcompany.com',
        organizationId: 'oil-company-789',
        role: UserRole.OWNER as string,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.OWNER);
      expect(result.organizationId).toBe('oil-company-789');
    });
  });
});
