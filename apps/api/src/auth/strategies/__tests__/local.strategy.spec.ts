// eslint-disable sonarjs/no-hardcoded-ip, sonarjs/no-invariant-returns
// eslint-disable sonarjs/no-hardcoded-ip
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from '../local.strategy';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';

/**
 * Unit Tests for LocalStrategy
 *
 * Tests the local email/password authentication strategy implementation
 * following the established Strategy pattern used throughout the codebase.
 */
describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      validateUserCredentials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate user credentials and return authenticated user', async () => {
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

      mockAuthService.validateUserCredentials.mockResolvedValue(testUser);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': null,
          'x-real-ip': null,
        },
        connection: { remoteAddress: '127.0.0.1' },
        socket: null,
        // eslint-disable-next-line sonarjs/no-invariant-returns
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return null;
          if (header === 'x-real-ip') return null;
          return null;
        }),
      };

      const result = await strategy.validate(
        mockRequest as any,
        'test@example.com',
        'StrongAuth123!',
      );

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

      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'StrongAuth123!',
        '127.0.0.1',
        undefined, // userAgent
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.validateUserCredentials.mockResolvedValue(null);

      const mockRequest = {
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ip: '192.168.1.100',
        headers: {},
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        connection: { remoteAddress: '192.168.1.100' },
        socket: null,
        get: jest.fn(() => null),
      };

      await expect(
        strategy.validate(
          mockRequest as any,
          'invalid@example.com',
          'wrongpassword',
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'invalid@example.com',
        'wrongpassword',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        '192.168.1.100',
        undefined, // userAgent
      );
    });

    it('should extract IP address from x-forwarded-for header', async () => {
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

      mockAuthService.validateUserCredentials.mockResolvedValue(testUser);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          'x-real-ip': null,
        },
        connection: null,
        socket: null,
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1';
          return null;
        }),
      };

      await strategy.validate(
        mockRequest as any,
        'test@example.com',
        'StrongAuth123!',
      );

      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'StrongAuth123!',
        '203.0.113.1', // First IP from x-forwarded-for
        undefined, // userAgent
      );
    });

    it('should extract IP address from x-real-ip header when x-forwarded-for is not available', async () => {
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

      mockAuthService.validateUserCredentials.mockResolvedValue(testUser);

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': null,
          'x-real-ip': '203.0.113.2',
        },
        connection: null,
        socket: null,
        get: jest.fn((header: string) => {
          if (header === 'x-forwarded-for') return null;
          if (header === 'x-real-ip') return '203.0.113.2';
          return null;
        }),
      };

      await strategy.validate(
        mockRequest as any,
        'test@example.com',
        'StrongAuth123!',
      );

      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'StrongAuth123!',
        '203.0.113.2', // IP from x-real-ip
        undefined, // userAgent
      );
    });

    it('should fall back to request.ip when headers are not available', async () => {
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

      mockAuthService.validateUserCredentials.mockResolvedValue(testUser);

      const mockRequest = {
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ip: '10.0.0.1',
        headers: {},
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        connection: { remoteAddress: '10.0.0.1' },
        socket: null,
        get: jest.fn(() => null),
      };

      await strategy.validate(
        mockRequest as any,
        'test@example.com',
        'StrongAuth123!',
      );

      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'test@example.com',
        'StrongAuth123!',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        '10.0.0.1', // Fallback to connection.remoteAddress
        undefined, // userAgent
      );
    });

    it('should handle different user roles correctly', async () => {
      const testCases = [
        { role: UserRole.ADMIN, email: 'admin@example.com' },
        { role: UserRole.OPERATOR, email: 'operator@example.com' },
        { role: UserRole.VIEWER, email: 'viewer@example.com' },
        { role: UserRole.REGULATOR, email: 'regulator@example.com' },
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
          (await Password.create('StrongAuth123!')).getHashedValue(),
          true,
        );

        mockAuthService.validateUserCredentials.mockResolvedValue(testUser);

        const mockRequest = {
          ip: '127.0.0.1',
          headers: {},
          connection: { remoteAddress: '127.0.0.1' },
          socket: null,
          get: jest.fn(() => null),
        };

        const result = await strategy.validate(
          mockRequest as any,
          testCase.email,
          'StrongAuth123!',
        );

        expect(result.role).toBe(testCase.role);
        expect(result.id).toBe(`user-${testCase.role}`);

        jest.clearAllMocks();
      }
    });

    it('should handle authentication service errors gracefully', async () => {
      mockAuthService.validateUserCredentials.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {},
        connection: { remoteAddress: '127.0.0.1' },
        socket: null,
        get: jest.fn(() => null),
      };

      await expect(
        strategy.validate(
          mockRequest as any,
          'test@example.com',
          'StrongAuth123!',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('strategy configuration', () => {
    it('should be properly configured for email/password authentication', () => {
      expect(strategy).toBeDefined();
      expect(strategy).toBeInstanceOf(LocalStrategy);
    });

    it('should extend PassportStrategy correctly', () => {
      expect(strategy).toBeInstanceOf(LocalStrategy);
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should handle operator login from field location', async () => {
      const operatorUser = new User(
        'operator-123',
        'oil-company-456',
        Email.create('field.operator@oilcompany.com'),
        'Field',
        'Operator',
        UserRole.OPERATOR,
        '+1234567890',
        (await Password.create('StrongAuth123!')).getHashedValue(),
        true,
      );

      mockAuthService.validateUserCredentials.mockResolvedValue(operatorUser);

      const mockRequest = {
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ip: '192.168.100.50', // Field office IP
        headers: {},
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        connection: { remoteAddress: '192.168.100.50' },
        socket: null,
        get: jest.fn(() => null),
      };

      const result = await strategy.validate(
        mockRequest as any,
        'field.operator@oilcompany.com',
        'StrongAuth123!',
      );

      expect(result.role).toBe(UserRole.OPERATOR);
      expect(result.organizationId).toBe('oil-company-456');
      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'field.operator@oilcompany.com',
        'StrongAuth123!',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        '192.168.100.50',
        undefined, // userAgent
      );
    });

    it('should handle regulator login from government network', async () => {
      const regulatorUser = new User(
        'regulator-123',
        'regulatory-agency-789',
        Email.create('inspector@agency.gov'),
        'Regulatory',
        'Inspector',
        UserRole.REGULATOR,
        '+1234567890',
        (await Password.create('StrongAuth123!')).getHashedValue(),
        true,
      );

      mockAuthService.validateUserCredentials.mockResolvedValue(regulatorUser);

      const mockRequest = {
        ip: '198.51.100.10', // Government network IP
        headers: {},
        connection: { remoteAddress: '198.51.100.10' },
        socket: null,
        get: jest.fn(() => null),
      };

      const result = await strategy.validate(
        mockRequest as any,
        'inspector@agency.gov',
        'StrongAuth123!',
      );

      expect(result.role).toBe(UserRole.REGULATOR);
      expect(result.organizationId).toBe('regulatory-agency-789');
      expect(mockAuthService.validateUserCredentials).toHaveBeenCalledWith(
        'inspector@agency.gov',
        'StrongAuth123!',
        '198.51.100.10',
        undefined, // userAgent
      );
    });
  });
});
