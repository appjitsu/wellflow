import { Password } from '../../domain/value-objects/password';
import { PasswordHistory } from '../../domain/entities/password-history.entity';
import { User, UserRole } from '../../domain/entities/user.entity';
import { randomUUID } from 'crypto';

/**
 * Integration Tests for Password Security Features
 *
 * Tests the integration between Password value object, PasswordHistory entity,
 * and User entity for comprehensive password security validation.
 */
describe('Password Security Integration', () => {
  describe('Password History Prevention', () => {
    it('should prevent reuse of recent passwords', async () => {
      // Create a series of passwords
      const password1 = await Password.create('FirstSecret123!');
      const password2 = await Password.create('SecondSecret123!');
      const password3 = await Password.create('ThirdSecret123!');

      // Simulate recent password hashes
      const recentHashes = [
        password1.getHashedValue(),
        password2.getHashedValue(),
        password3.getHashedValue(),
      ];

      // Try to reuse the first password - should fail
      await expect(
        Password.createWithHistoryValidation('FirstSecret123!', recentHashes),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );

      // Try to reuse the second password - should fail
      await expect(
        Password.createWithHistoryValidation('SecondSecret123!', recentHashes),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );

      // Try a new password - should succeed
      const newPassword = await Password.createWithHistoryValidation(
        'NewUniqueSecret123!',
        recentHashes,
      );

      expect(newPassword).toBeInstanceOf(Password);
    });

    it('should allow password reuse when history is empty', async () => {
      const emptyHistory: string[] = [];

      const password = await Password.createWithHistoryValidation(
        'AnySecret123!',
        emptyHistory,
      );

      expect(password).toBeInstanceOf(Password);
    });

    it('should handle partial history (less than 5 entries)', async () => {
      const password1 = await Password.create('OnlySecret123!');
      const partialHistory = [password1.getHashedValue()];

      // Should reject reused password
      await expect(
        Password.createWithHistoryValidation('OnlySecret123!', partialHistory),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );

      // Should accept new password
      const newPassword = await Password.createWithHistoryValidation(
        'DifferentSecret123!',
        partialHistory,
      );

      expect(newPassword).toBeInstanceOf(Password);
    });
  });

  describe('User Password Management Integration', () => {
    it('should integrate password reset token functionality', async () => {
      const user = await User.create(
        randomUUID(), // organizationId
        'test@example.com', // email
        'Test', // firstName
        'User', // lastName
        UserRole.PUMPER, // role
        'InitialSecret123!', // plainTextPassword
      );

      // Initially no reset token
      expect(user.getPasswordResetToken()).toBeUndefined();
      expect(user.getPasswordResetExpiresAt()).toBeUndefined();

      // Set reset token
      const resetToken = 'secure-reset-token-123';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      user.setPasswordResetToken(resetToken, expiresAt);

      expect(user.getPasswordResetToken()).toBe(resetToken);
      expect(user.getPasswordResetExpiresAt()).toEqual(expiresAt);

      // Validate token
      expect(user.validatePasswordResetToken(resetToken)).toBe(true);
      expect(user.validatePasswordResetToken('wrong-token')).toBe(false);

      // Clear token
      user.clearPasswordResetToken();
      expect(user.getPasswordResetToken()).toBeUndefined();
      expect(user.getPasswordResetExpiresAt()).toBeUndefined();
    });

    it('should validate expired reset tokens', async () => {
      const user = await User.create(
        randomUUID(), // organizationId
        'test@example.com', // email
        'Test', // firstName
        'User', // lastName
        UserRole.PUMPER, // role
        'InitialSecret123!', // plainTextPassword
      );

      // Set expired token
      const resetToken = 'expired-token';
      const expiredDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      user.setPasswordResetToken(resetToken, expiredDate);

      // Should reject expired token
      expect(user.validatePasswordResetToken(resetToken)).toBe(false);
    });

    it('should handle password changes with history tracking', async () => {
      const user = await User.create(
        randomUUID(), // organizationId
        'test@example.com', // email
        'Test', // firstName
        'User', // lastName
        UserRole.PUMPER, // role
        'InitialSecret123!', // plainTextPassword
      );

      const userId = user.getId();
      const initialPasswordHash = user.getPasswordHash()!;

      // Create initial password history
      const initialHistory = PasswordHistory.create(
        userId,
        initialPasswordHash,
      );
      expect(initialHistory.getUserId()).toBe(userId);
      expect(initialHistory.getPasswordHash()).toBe(initialPasswordHash);

      // Change password
      await user.changePassword('NewSecret123!');

      // Verify password changed
      expect(user.getPasswordHash()).not.toBe(initialPasswordHash);
      expect(await user.validatePassword('NewSecret123!')).toBe(true);
      expect(await user.validatePassword('InitialSecret123!')).toBe(false);

      // Create new history entry
      const newHistory = PasswordHistory.create(
        userId,
        user.getPasswordHash()!,
      );
      expect(newHistory.getUserId()).toBe(userId);
      expect(newHistory.getPasswordHash()).toBe(user.getPasswordHash());
    });
  });

  describe('Password Complexity Integration', () => {
    it('should enforce all complexity requirements together', async () => {
      const testCases = [
        {
          password: 'short',
          expectedError: 'Password must be at least 8 characters long',
        },
        {
          password: 'nouppercase123!',
          expectedError: 'Password must contain at least one uppercase letter',
        },
        {
          password: 'NOLOWERCASE123!',
          expectedError: 'Password must contain at least one lowercase letter',
        },
        {
          password: 'NoNumbers!',
          expectedError: 'Password must contain at least one number',
        },
        {
          password: 'NoSpecialChars123',
          expectedError: 'Password must contain at least one special character',
        },
        {
          password: 'A'.repeat(129) + '1!',
          expectedError: 'Password cannot exceed 128 characters',
        },
      ];

      for (const testCase of testCases) {
        await expect(Password.create(testCase.password)).rejects.toThrow(
          testCase.expectedError,
        );
      }

      // Valid password should work
      const validPassword = await Password.create('ValidSecret123!');
      expect(validPassword).toBeInstanceOf(Password);
    });

    it('should handle edge cases in password validation', async () => {
      // Minimum valid password
      const minValid = await Password.create('Aa1!bcde');
      expect(minValid).toBeInstanceOf(Password);

      // Maximum valid password (avoid repeated characters)
      const maxValid = await Password.create(
        'X9yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3w!@#',
      );
      expect(maxValid).toBeInstanceOf(Password);

      // Unicode characters
      const unicodePassword = await Password.create('Válid789!ñáéíóú');
      expect(unicodePassword).toBeInstanceOf(Password);

      // Various special characters
      const specialChars = await Password.create('Strong789@#$%^&*()');
      expect(specialChars).toBeInstanceOf(Password);
    });
  });

  describe('PasswordHistory Entity Validation', () => {
    it('should validate bcrypt hash formats strictly', () => {
      const userId = randomUUID();

      // Valid bcrypt hashes
      const validHashes = [
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxVv0v3G2irc6W6sefkqyHu',
        '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      ];

      validHashes.forEach((hash) => {
        expect(() => PasswordHistory.create(userId, hash)).not.toThrow();
      });

      // Invalid hashes
      const invalidHashes = [
        'plaintext-password',
        '$1$invalid$hash',
        'md5hash',
        '$2b$12$tooshort',
        '$2b$12$toolong' + 'x'.repeat(100),
      ];

      invalidHashes.forEach((hash) => {
        expect(() => PasswordHistory.create(userId, hash)).toThrow(
          'Invalid bcrypt password hash format',
        );
      });
    });

    it('should validate user ID format', () => {
      const validHash =
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe';

      // Valid UUID
      const validUUID = randomUUID();
      expect(() => PasswordHistory.create(validUUID, validHash)).not.toThrow();

      // Invalid UUIDs
      const invalidUUIDs = ['not-a-uuid', '', '123', 'invalid-format'];

      invalidUUIDs.forEach((invalidId) => {
        expect(() => PasswordHistory.create(invalidId, validHash)).toThrow();
      });
    });

    it('should track creation timestamps accurately', () => {
      const userId = randomUUID();
      const validHash =
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe';

      const beforeCreation = new Date();
      const history = PasswordHistory.create(userId, validHash);
      const afterCreation = new Date();

      const createdAt = history.getCreatedAt();
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('End-to-End Password Security Workflow', () => {
    it('should demonstrate complete password security lifecycle', async () => {
      const userId = randomUUID();

      // Step 1: Create initial password and user
      const user = await User.create(
        randomUUID(), // organizationId
        'user@example.com', // email
        'Test', // firstName
        'User', // lastName
        UserRole.PUMPER, // role
        'InitialSecret123!', // plainTextPassword
      );

      // Step 2: Create password history entry
      const history1 = PasswordHistory.create(userId, user.getPasswordHash()!);
      expect(history1.matchesPasswordHash(user.getPasswordHash()!)).toBe(true);

      // Step 3: Change password (simulate password change)
      const secondPassword = await Password.create('SecondSecret123!');
      const history2 = PasswordHistory.create(
        userId,
        secondPassword.getHashedValue(),
      );

      // Step 4: Try to reuse first password (should fail)
      const passwordHistory = [
        history1.getPasswordHash(),
        history2.getPasswordHash(),
      ];

      await expect(
        Password.createWithHistoryValidation(
          'InitialSecret123!',
          passwordHistory,
        ),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );

      // Step 5: Use new unique password (should succeed)
      const thirdPassword = await Password.createWithHistoryValidation(
        'ThirdUniqueSecret123!',
        passwordHistory,
      );

      expect(thirdPassword).toBeInstanceOf(Password);
      expect(await thirdPassword.verify('ThirdUniqueSecret123!')).toBe(true);

      // Step 6: Verify password complexity is maintained
      expect(thirdPassword.getHashedValue()).not.toBe('ThirdUniqueSecret123!');
      expect(thirdPassword.getHashedValue().startsWith('$2b$')).toBe(true);
    });
  });
});
