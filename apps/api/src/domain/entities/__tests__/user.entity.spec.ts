import { User, UserRole } from '../user.entity';
// eslint-disable sonarjs/no-hardcoded-ip
import { Email } from '../../value-objects/email';
import { Password } from '../../value-objects/password';
import { AuthToken } from '../../value-objects/auth-token';
import { UserRegisteredEvent } from '../../events/user-registered.event';
import { UserLoggedInEvent } from '../../events/user-logged-in.event';
import { UserAccountLockedEvent } from '../../events/user-account-locked.event';
import { UserEmailVerifiedEvent } from '../../events/user-email-verified.event';

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
});

// Mock bcrypt for Password
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('User Entity', () => {
  const validId = 'user-123';
  const validOrganizationId = 'org-456';
  const validEmail = 'test@example.com';
  const validFirstName = 'John';
  const validLastName = 'Doe';
  const validRole = UserRole.OWNER;
  const validPhone = '+1234567890';
  const validPasswordHash = process.env.TEST_PASSWORD_HASH || 'hashed-password';
  const validToken = 'valid-token-12345678901234567890123456789012';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRandomUUID.mockReturnValue(validId);
  });

  describe('Constructor', () => {
    it('should create user with required fields', () => {
      const emailVO = Email.create(validEmail);

      const user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
      );

      expect(user.getId()).toBe(validId);
      expect(user.getOrganizationId()).toBe(validOrganizationId);
      expect(user.getEmail()).toBe(emailVO);
      expect(user.getFirstName()).toBe(validFirstName);
      expect(user.getLastName()).toBe(validLastName);
      expect(user.getRole()).toBe(validRole);
      expect(user.getPhone()).toBeUndefined();
      expect(user.isEmailVerified()).toBe(false);
      expect(user.isAccountLocked()).toBe(false);
      expect(user.getFailedLoginAttempts()).toBe(0);
      expect(user.isAccountActive()).toBe(true);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create user with all optional fields', () => {
      const emailVO = Email.create(validEmail);

      const user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
        validPhone,
        validPasswordHash,
        true, // emailVerified
        validToken, // emailVerificationToken
        new Date(Date.now() + 24 * 60 * 60 * 1000), // emailVerificationExpiresAt
        2, // failedLoginAttempts
        new Date(Date.now() + 30 * 60 * 1000), // lockedUntil
        1, // lockoutCount
        validToken, // passwordResetToken
        new Date(Date.now() + 60 * 60 * 1000), // passwordResetExpiresAt
        false, // isActive
        new Date('2024-01-01'), // lastLoginAt
        new Date('2024-01-01'), // createdAt
        new Date('2024-01-02'), // updatedAt
      );

      expect(user.getPhone()).toBe(validPhone);
      expect(user.isEmailVerified()).toBe(true);
      expect(user.isAccountLocked()).toBe(true);
      expect(user.getFailedLoginAttempts()).toBe(2);
      expect(user.isAccountActive()).toBe(false);
      expect(user.getLastLoginAt()).toBeInstanceOf(Date);
    });
  });

  describe('Factory Method - create', () => {
    beforeEach(() => {
      // Mock Password.create
      jest.spyOn(Password, 'create').mockResolvedValue({
        getHashedValue: () => validPasswordHash,
      } as Password);

      // Mock AuthToken.createEmailVerificationToken
      jest.spyOn(AuthToken, 'createEmailVerificationToken').mockReturnValue({
        getValue: () => validToken,
        getExpiresAt: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as AuthToken);
    });

    it('should create user and raise domain event', async () => {
      const plainTextPassword = process.env.TEST_PASSWORD || 'ValidPass123!';

      const user = await User.create(
        validOrganizationId,
        validEmail,
        validFirstName,
        validLastName,
        validRole,
        plainTextPassword,
        validPhone,
      );

      expect(user.getId()).toBe(validId);
      expect(user.getOrganizationId()).toBe(validOrganizationId);
      expect(user.getEmail().getValue()).toBe(validEmail);
      expect(user.getFirstName()).toBe(validFirstName);
      expect(user.getLastName()).toBe(validLastName);
      expect(user.getRole()).toBe(validRole);
      expect(user.getPhone()).toBe(validPhone);
      expect(user.isEmailVerified()).toBe(false);
      expect(user.isAccountActive()).toBe(true);

      const domainEvents = user.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0]).toBeInstanceOf(UserRegisteredEvent);
      const event = domainEvents[0] as UserRegisteredEvent;
      expect(event.userId).toBe(validId);
      expect(event.organizationId).toBe(validOrganizationId);
      expect(event.email).toBe(validEmail);
      expect(event.firstName).toBe(validFirstName);
      expect(event.lastName).toBe(validLastName);
      expect(event.role).toBe(validRole);
      expect(event.requiresEmailVerification).toBe(true);
    });
  });

  describe('Getters', () => {
    let user: User;
    let emailVO: Email;

    beforeEach(() => {
      emailVO = Email.create(validEmail);
      user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
        validPhone,
      );
    });

    it('should return correct id', () => {
      expect(user.getId()).toBe(validId);
    });

    it('should return correct organization id', () => {
      expect(user.getOrganizationId()).toBe(validOrganizationId);
    });

    it('should return correct email', () => {
      expect(user.getEmail()).toBe(emailVO);
    });

    it('should return correct first name', () => {
      expect(user.getFirstName()).toBe(validFirstName);
    });

    it('should return correct last name', () => {
      expect(user.getLastName()).toBe(validLastName);
    });

    it('should return correct full name', () => {
      expect(user.getFullName()).toBe(`${validFirstName} ${validLastName}`);
    });

    it('should return correct role', () => {
      expect(user.getRole()).toBe(validRole);
    });

    it('should return correct phone', () => {
      expect(user.getPhone()).toBe(validPhone);
    });

    it('should return correct email verified status', () => {
      expect(user.isEmailVerified()).toBe(false);
    });

    it('should return correct account locked status', () => {
      expect(user.isAccountLocked()).toBe(false);
    });

    it('should return correct failed login attempts', () => {
      expect(user.getFailedLoginAttempts()).toBe(0);
    });

    it('should return correct last login at', () => {
      expect(user.getLastLoginAt()).toBeUndefined();
    });

    it('should return correct account active status', () => {
      expect(user.isAccountActive()).toBe(true);
    });

    it('should return correct created at', () => {
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should return correct updated at', () => {
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('Authentication Methods', () => {
    let user: User;
    let emailVO: Email;

    beforeEach(() => {
      emailVO = Email.create(validEmail);
      user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
        validPhone,
        validPasswordHash,
      );
    });

    describe('validatePassword', () => {
      it('should return false if no password hash', async () => {
        const userWithoutPassword = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
        );

        const result = await userWithoutPassword.validatePassword('password');
        expect(result).toBe(false);
      });

      it('should validate password using Password.verify', async () => {
        const mockPassword = {
          verify: jest.fn().mockResolvedValue(true),
        };
        jest.spyOn(Password, 'fromHash').mockReturnValue(mockPassword as any);

        const result = await user.validatePassword('password123');
        expect(result).toBe(true);
        expect(Password.fromHash).toHaveBeenCalledWith(validPasswordHash);
        expect(mockPassword.verify).toHaveBeenCalledWith('password123');
      });
    });

    describe('recordSuccessfulLogin', () => {
      it('should throw error if account is locked', () => {
        const lockedUser = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          false,
          undefined,
          undefined,
          5,
          new Date(Date.now() + 30 * 60 * 1000), // lockedUntil future
        );

        expect(() => {
          lockedUser.recordSuccessfulLogin();
        }).toThrow('Cannot login: account is locked');
      });

      it('should throw error if account is inactive', () => {
        const inactiveUser = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          false,
          undefined,
          undefined,
          0,
          undefined,
          0, // lockoutCount
          undefined,
          undefined,
          false, // isActive
        );

        expect(() => {
          inactiveUser.recordSuccessfulLogin();
        }).toThrow('Cannot login: account is inactive');
      });

      it('should record successful login and reset failed attempts', () => {
        const userWithFailedAttempts = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          false,
          undefined,
          undefined,
          3, // failedLoginAttempts
          new Date(Date.now() - 30 * 60 * 1000), // lockedUntil past
        );

        userWithFailedAttempts.recordSuccessfulLogin(
          // eslint-disable-next-line sonarjs/no-hardcoded-ip
          '192.168.1.1',
          'Chrome/91.0',
        );

        expect(userWithFailedAttempts.getFailedLoginAttempts()).toBe(0);
        expect(userWithFailedAttempts.isAccountLocked()).toBe(false);
        expect(userWithFailedAttempts.getLastLoginAt()).toBeInstanceOf(Date);

        const domainEvents = userWithFailedAttempts.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(UserLoggedInEvent);
        const event = domainEvents[0] as UserLoggedInEvent;
        expect(event.userId).toBe(validId);
        expect(event.organizationId).toBe(validOrganizationId);
        expect(event.email).toBe(validEmail);
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        expect(event.ipAddress).toBe('192.168.1.1');
        expect(event.userAgent).toBe('Chrome/91.0');
      });
    });

    describe('recordFailedLoginAttempt', () => {
      it('should increment failed attempts and update timestamp', () => {
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        user.recordFailedLoginAttempt('192.168.1.1', 'Chrome/91.0');

        expect(user.getFailedLoginAttempts()).toBe(1);
        expect(user.getUpdatedAt()).toBeInstanceOf(Date);
      });

      it('should lock account after 5 failed attempts', () => {
        const userWith4Attempts = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          false,
          undefined,
          undefined,
          4, // failedLoginAttempts
        );

        userWith4Attempts.recordFailedLoginAttempt(
          // eslint-disable-next-line sonarjs/no-hardcoded-ip
          '192.168.1.1',
          'Chrome/91.0',
        );

        expect(userWith4Attempts.getFailedLoginAttempts()).toBe(5);
        expect(userWith4Attempts.isAccountLocked()).toBe(true);

        const domainEvents = userWith4Attempts.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(UserAccountLockedEvent);
        const event = domainEvents[0] as UserAccountLockedEvent;
        expect(event.userId).toBe(validId);
        expect(event.organizationId).toBe(validOrganizationId);
        expect(event.email).toBe(validEmail);
        expect(event.failedAttempts).toBe(5);
        expect(event.lockedUntil).toBeInstanceOf(Date);
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        expect(event.ipAddress).toBe('192.168.1.1');
        expect(event.userAgent).toBe('Chrome/91.0');
      });
    });
  });

  describe('Email Verification', () => {
    let user: User;
    let emailVO: Email;

    beforeEach(() => {
      emailVO = Email.create(validEmail);
      user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
        validPhone,
        validPasswordHash,
        false, // emailVerified
        validToken, // emailVerificationToken
        new Date(Date.now() + 24 * 60 * 60 * 1000), // emailVerificationExpiresAt
      );
    });

    describe('verifyEmail', () => {
      it('should do nothing if already verified', () => {
        const verifiedUser = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          true, // emailVerified
        );

        verifiedUser.verifyEmail(validToken);

        expect(verifiedUser.isEmailVerified()).toBe(true);
        expect(verifiedUser.getDomainEvents()).toHaveLength(0);
      });

      it('should throw error if no verification token', () => {
        const userWithoutToken = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
        );

        expect(() => {
          userWithoutToken.verifyEmail(validToken);
        }).toThrow('No email verification token found');
      });

      it('should throw error if token does not match', () => {
        expect(() => {
          user.verifyEmail('wrong-token');
        }).toThrow('Invalid email verification token');
      });

      it('should throw error if token is expired', () => {
        const userWithExpiredToken = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          undefined,
          false,
          validToken,
          new Date(Date.now() - 24 * 60 * 60 * 1000), // expired
        );

        expect(() => {
          userWithExpiredToken.verifyEmail(validToken);
        }).toThrow('Email verification token has expired');
      });

      it('should verify email and raise domain event', () => {
        user.verifyEmail(validToken);

        expect(user.isEmailVerified()).toBe(true);
        expect(user.getUpdatedAt()).toBeInstanceOf(Date);

        const domainEvents = user.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(UserEmailVerifiedEvent);
        const event = domainEvents[0] as UserEmailVerifiedEvent;
        expect(event.userId).toBe(validId);
        expect(event.organizationId).toBe(validOrganizationId);
        expect(event.email).toBe(validEmail);
        expect(event.verifiedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Password Reset', () => {
    let user: User;
    let emailVO: Email;

    beforeEach(() => {
      emailVO = Email.create(validEmail);
      user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
        validPhone,
        validPasswordHash,
      );

      // Mock AuthToken.createPasswordResetToken
      jest.spyOn(AuthToken, 'createPasswordResetToken').mockReturnValue({
        getValue: () => validToken,
        getExpiresAt: () => new Date(Date.now() + 60 * 60 * 1000),
      } as AuthToken);
    });

    describe('generatePasswordResetToken', () => {
      it('should generate password reset token', () => {
        const token = user.generatePasswordResetToken();

        expect(token.getValue()).toBe(validToken);
        expect(token.getExpiresAt()).toBeInstanceOf(Date);
        expect(user.getUpdatedAt()).toBeInstanceOf(Date);
      });
    });

    describe('resetPassword', () => {
      beforeEach(() => {
        // Mock Password.create
        jest.spyOn(Password, 'create').mockResolvedValue({
          getHashedValue: () => 'new-hashed-password',
        } as Password);
      });

      it('should throw error if no reset token', async () => {
        await expect(
          user.resetPassword(validToken, 'NewPass123!'),
        ).rejects.toThrow('No password reset token found');
      });

      it('should throw error if token does not match', async () => {
        user.generatePasswordResetToken(); // Set the token

        await expect(
          user.resetPassword('wrong-token', 'NewPass123!'),
        ).rejects.toThrow('Invalid password reset token');
      });

      it('should throw error if token is expired', async () => {
        const expiredUser = new User(
          validId,
          validOrganizationId,
          emailVO,
          validFirstName,
          validLastName,
          validRole,
          undefined,
          validPasswordHash,
          false,
          undefined,
          undefined,
          0,
          undefined,
          0, // lockoutCount
          validToken,
          new Date('2024-01-01'), // expired
          true, // isActive
        );

        await expect(
          expiredUser.resetPassword(validToken, 'NewPass123!'),
        ).rejects.toThrow('Password reset token has expired');
      });

      it('should reset password and clear tokens', async () => {
        user.generatePasswordResetToken(); // Set the token

        await user.resetPassword(validToken, 'NewPass123!');

        expect(user.getFailedLoginAttempts()).toBe(0);
        expect(user.isAccountLocked()).toBe(false);
        expect(user.getUpdatedAt()).toBeInstanceOf(Date);
      });
    });
  });

  describe('Domain Events Management', () => {
    let user: User;
    let emailVO: Email;

    beforeEach(() => {
      emailVO = Email.create(validEmail);
      user = new User(
        validId,
        validOrganizationId,
        emailVO,
        validFirstName,
        validLastName,
        validRole,
      );
    });

    it('should add domain event', () => {
      const event = new UserRegisteredEvent(
        validId,
        validOrganizationId,
        validEmail,
        validFirstName,
        validLastName,
        validRole,
      );

      user.addDomainEvent(event);

      const domainEvents = user.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0]).toBe(event);
    });

    it('should return copy of domain events', () => {
      const event = new UserRegisteredEvent(
        validId,
        validOrganizationId,
        validEmail,
        validFirstName,
        validLastName,
        validRole,
      );

      user.addDomainEvent(event);
      const domainEvents1 = user.getDomainEvents();
      const domainEvents2 = user.getDomainEvents();

      expect(domainEvents1).not.toBe(domainEvents2); // Different references
      expect(domainEvents1).toEqual(domainEvents2); // Same content
    });

    it('should clear domain events', () => {
      const event = new UserRegisteredEvent(
        validId,
        validOrganizationId,
        validEmail,
        validFirstName,
        validLastName,
        validRole,
      );

      user.addDomainEvent(event);
      expect(user.getDomainEvents()).toHaveLength(1);

      user.clearDomainEvents();
      expect(user.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('UserRole Enum', () => {
    it('should have correct role values', () => {
      expect(UserRole.OWNER).toBe('owner');
      expect(UserRole.MANAGER).toBe('manager');
      expect(UserRole.PUMPER).toBe('pumper');
    });
  });
});
