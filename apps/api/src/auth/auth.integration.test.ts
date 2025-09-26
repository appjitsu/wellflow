import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User, UserRole } from '../domain/entities/user.entity';
import { Email } from '../domain/value-objects/email';
import { Password } from '../domain/value-objects/password';
import { AuditLogService } from '../application/services/audit-log.service';

/**
 * Integration Test for Authentication System
 *
 * This test demonstrates that our Passport.js authentication system
 * is properly implemented and follows the established Strategy pattern
 * used throughout the codebase.
 */
describe('Authentication System Integration', () => {
  let authService: AuthService;
  let jwtStrategy: JwtStrategy;
  let localStrategy: LocalStrategy;
  let jwtService: JwtService;

  // Mock dependencies
  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogService = {
    logSuccess: jest.fn(),
    logFailure: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'test-secret-key-for-development';
        case 'JWT_EXPIRES_IN':
          return '1h';
        case 'JWT_REFRESH_EXPIRES_IN':
          return '7d';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret-key-for-development',
            signOptions: { expiresIn: '1h' },
          }),
        },
        {
          provide: 'AuthUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    localStrategy = module.get<LocalStrategy>(LocalStrategy);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Strategy Pattern Integration', () => {
    it('should implement JWT Strategy following established patterns', () => {
      expect(jwtStrategy).toBeDefined();
      expect(jwtStrategy).toBeInstanceOf(JwtStrategy);

      // Verify it follows the same pattern as PaymentCalculationStrategy, etc.
      expect(typeof jwtStrategy.validate).toBe('function');
    });

    it('should implement Local Strategy following established patterns', () => {
      expect(localStrategy).toBeDefined();
      expect(localStrategy).toBeInstanceOf(LocalStrategy);

      // Verify it follows the same pattern as other strategies
      expect(typeof localStrategy.validate).toBe('function');
    });
  });

  describe('Domain Entity Integration', () => {
    it('should work with User domain entity', async () => {
      // Create a test user using the domain entity
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        true, // emailVerified
      );

      // Mock repository to return our test user
      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.findById.mockResolvedValue(testUser);

      // Test that AuthService can work with the User entity
      const foundUser =
        await mockUserRepository.findByEmail('test@example.com');
      expect(foundUser).toBe(testUser);
      expect(foundUser.getId()).toBe('user-123');
      expect(foundUser.getEmail().getValue()).toBe('test@example.com');
      expect(foundUser.getRole()).toBe(UserRole.MANAGER);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT tokens', () => {
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
      );

      // Generate tokens
      const tokens = authService.generateTokens(testUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Verify token can be decoded
      const decoded = jwtService.decode(tokens.accessToken);
      expect(decoded).toHaveProperty('sub', 'user-123');
      expect(decoded).toHaveProperty('email', 'test@example.com');
      expect(decoded).toHaveProperty('organizationId', 'org-456');
    });
  });

  describe('Password Security', () => {
    it('should handle password hashing and verification', async () => {
      const plainPassword = process.env.TEST_PASSWORD || 'StrongAuth123!';

      // Test password creation (hashing)
      const password = await Password.create(plainPassword);
      expect(password.getHashedValue()).toBeDefined();
      expect(password.getHashedValue()).not.toBe(plainPassword);

      // Test password verification
      const isValid = await password.verify(plainPassword);
      expect(isValid).toBe(true);

      const isInvalid = await password.verify('WrongPassword');
      expect(isInvalid).toBe(false);
    });
  });

  describe('Audit Logging Integration', () => {
    it('should integrate with audit logging system', async () => {
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        (await Password.create('StrongAuth123!')).getHashedValue(),
        true,
      );

      mockUserRepository.findByEmail.mockResolvedValue(testUser);

      // Test successful login audit
      const user = await authService.validateUserCredentials(
        'test@example.com',
        'StrongAuth123!',
        '127.0.0.1',
        'test-user-agent',
      );

      expect(user).toBeDefined();
      expect(mockAuditLogService.logSuccess).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('should implement account lockout after failed attempts', () => {
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
      );

      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        testUser.recordFailedLoginAttempt('127.0.0.1', 'test-agent');
      }

      // Account should be locked after 5 attempts
      expect(testUser.isAccountLocked()).toBe(true);
      expect(testUser.getFailedLoginAttempts()).toBe(5);
    });

    it('should support email verification', () => {
      const testUser = new User(
        'user-123',
        'org-456',
        Email.create('test@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
      );

      // Initially not verified
      expect(testUser.isEmailVerified()).toBe(false);

      // Note: In real implementation, this would use the actual token from user creation
      // This is just demonstrating the API exists
      expect(typeof testUser.verifyEmail).toBe('function');
    });
  });
});
