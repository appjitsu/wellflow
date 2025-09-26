// eslint-disable sonarjs/no-hardcoded-passwords, @typescript-eslint/await-thenable
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../domain/entities/user.entity';
import { Email } from '../domain/value-objects/email';
import { Password } from '../domain/value-objects/password';
import { AuditLogService } from '../application/services/audit-log.service';
import { EmailService } from '../application/services/email.service';
import { OrganizationsService } from '../organizations/organizations.service';

/**
 * Unit Tests for AuthService
 *
 * Tests the core authentication service functionality including
 * user registration, validation, token generation, and security features.
 */
describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockAuditLogService: any;
  let mockEmailService: any;
  let mockOrganizationsService: any;

  beforeEach(async () => {
    // Mock dependencies
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_SECRET':
            return 'test-secret-key';
          case 'JWT_EXPIRES_IN':
            return '1h';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          default:
            return undefined;
        }
      }),
    };

    mockAuditLogService = {
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    };

    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendEmailVerification: jest.fn(),
    };

    mockOrganizationsService = {
      createOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUserCredentials', () => {
    it('should validate user credentials successfully', async () => {
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

      const result = await service.validateUserCredentials(
        'test@example.com',
        'StrongAuth123!',
        '127.0.0.1',
      );

      expect(result).toBe(testUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockAuditLogService.logSuccess).toHaveBeenCalled();
    });

    it('should return null for invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUserCredentials(
        'invalid@example.com',
        'wrongpassword',
        '127.0.0.1',
      );

      expect(result).toBeNull();
      expect(mockAuditLogService.logFailure).toHaveBeenCalled();
    });

    it('should handle account lockout', async () => {
      const lockedUser = new User(
        'user-123',
        'org-456',
        Email.create('locked@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        (await Password.create('StrongAuth123!')).getHashedValue(),
        true,
      );

      // Simulate locked account
      lockedUser.recordFailedLoginAttempt();
      lockedUser.recordFailedLoginAttempt();
      lockedUser.recordFailedLoginAttempt();
      lockedUser.recordFailedLoginAttempt();
      lockedUser.recordFailedLoginAttempt(); // 5th attempt should lock

      mockUserRepository.findByEmail.mockResolvedValue(lockedUser);

      // The service should throw an UnauthorizedException for locked accounts
      await expect(
        service.validateUserCredentials(
          'locked@example.com',
          'StrongAuth123!',
          '127.0.0.1',
        ),
      ).rejects.toThrow('Account is temporarily locked');

      expect(mockAuditLogService.logFailure).toHaveBeenCalledWith(
        'LOGIN',
        'USER',
        'user-123',
        'Account locked',
        {},
        expect.objectContaining({
          businessContext: expect.objectContaining({
            email: 'locked@example.com',
            failedAttempts: 5,
          }),
          ipAddress: '127.0.0.1',
        }),
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
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

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = service.generateTokens(testUser);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        // eslint-disable-next-line sonarjs/no-hardcoded-passwords
        password: 'MyStr0ngP@ssw0rd2024!',
        firstName: 'Jane',
        lastName: 'Smith',
        organizationId: 'org-789',
        role: UserRole.PUMPER,
        phone: '+1987654321',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(
        new User(
          'user-456',
          'org-789',
          Email.create('newuser@example.com'),
          'Jane',
          'Smith',
          UserRole.PUMPER,
          '+1987654321',
          'hashed-password',
          false,
        ),
      );

      const result = await service.register(registerData);

      expect(result).toBeDefined();
      expect(result.getEmail().getValue()).toBe('newuser@example.com');
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        'CREATE',
        'USER',
        'user-456',
        expect.objectContaining({
          newValues: expect.objectContaining({
            email: 'newuser@example.com',
            organizationId: 'org-789',
          }),
        }),
      );
    });

    it('should throw error for duplicate email', async () => {
      const registerData = {
        email: 'existing@example.com',
        // eslint-disable-next-line sonarjs/no-hardcoded-passwords
        password: 'MyStr0ngP@ssw0rd2024!',
        firstName: 'Jane',
        lastName: 'Smith',
        organizationId: 'org-789',
        role: UserRole.PUMPER,
        phone: '+1987654321',
      };

      const existingUser = new User(
        'user-123',
        'org-456',
        Email.create('existing@example.com'),
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        true,
      );

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(registerData)).rejects.toThrow(
        'User with this email already exists',
      );

      // No audit log should be called since the method throws before logging
      expect(mockAuditLogService.logFailure).not.toHaveBeenCalled();
      expect(mockAuditLogService.logSuccess).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const testUser = User.fromDatabase(
        'user-123',
        'org-456',
        'test@example.com',
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        false, // Not verified
        'valid-token', // Email verification token
        new Date(Date.now() + 3600000), // Expires in 1 hour
      );

      mockUserRepository.findById.mockResolvedValue(testUser);
      mockUserRepository.save.mockResolvedValue(testUser);

      // Should not throw an exception
      await expect(
        service.verifyEmail('user-123', 'valid-token'),
      ).resolves.not.toThrow();

      expect(testUser.isEmailVerified()).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(testUser);
      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        'UPDATE',
        'USER',
        'user-123',
        {},
        expect.objectContaining({
          businessContext: expect.objectContaining({
            action: 'email_verified',
            email: 'test@example.com',
          }),
        }),
      );
    });

    it('should throw error for invalid token', async () => {
      const testUser = User.fromDatabase(
        'user-123',
        'org-456',
        'test@example.com',
        'John',
        'Doe',
        UserRole.MANAGER,
        '+1234567890',
        'hashed-password',
        false,
        'valid-token', // Different from the one we'll test with
        new Date(Date.now() + 3600000), // Expires in 1 hour
      );

      mockUserRepository.findById.mockResolvedValue(testUser);

      // Should throw an exception for invalid token
      await expect(
        service.verifyEmail('user-123', 'invalid-token'),
      ).rejects.toThrow('Invalid email verification token');

      // No audit log should be called since the method throws before logging
      expect(mockAuditLogService.logSuccess).not.toHaveBeenCalled();
      expect(mockAuditLogService.logFailure).not.toHaveBeenCalled();
    });
  });

  describe('security features', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have proper dependency injection', () => {
      expect(service).toBeInstanceOf(AuthService);
    });
  });
});
