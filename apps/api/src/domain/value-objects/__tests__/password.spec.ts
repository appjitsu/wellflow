import { Password } from '../password';

/**
 * Unit Tests for Password Value Object
 *
 * Tests password creation, validation, complexity requirements,
 * and password history validation functionality.
 */
describe('Password', () => {
  describe('create', () => {
    it('should create a valid password with proper complexity', async () => {
      const plainPassword = 'ValidPass123!';
      const password = await Password.create(plainPassword);

      expect(password).toBeInstanceOf(Password);
      expect(password.getHashedValue()).toBeDefined();
      expect(password.getHashedValue()).not.toBe(plainPassword); // Should be hashed
    });

    it('should reject password that is too short', async () => {
      const shortPassword = 'Short1!';

      await expect(Password.create(shortPassword)).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should reject password without uppercase letter', async () => {
      const noUppercase = 'validpass123!';

      await expect(Password.create(noUppercase)).rejects.toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should reject password without lowercase letter', async () => {
      const noLowercase = 'VALIDPASS123!';

      await expect(Password.create(noLowercase)).rejects.toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should reject password without number', async () => {
      const noNumber = 'ValidPassword!';

      await expect(Password.create(noNumber)).rejects.toThrow(
        'Password must contain at least one number',
      );
    });

    it('should reject password without special character', async () => {
      const noSpecial = 'ValidPassword123';

      await expect(Password.create(noSpecial)).rejects.toThrow(
        'Password must contain at least one special character',
      );
    });

    it('should reject password that is too long', async () => {
      const tooLong = 'A'.repeat(129) + '1!';

      await expect(Password.create(tooLong)).rejects.toThrow(
        'Password cannot exceed 128 characters',
      );
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const plainPassword = 'ValidPass123!';
      const password = await Password.create(plainPassword);

      const isValid = await password.verify(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plainPassword = 'ValidPass123!';
      const wrongPassword = 'WrongPass123!';
      const password = await Password.create(plainPassword);

      const isValid = await password.verify(wrongPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('createWithHistoryValidation', () => {
    it('should create password when not in history', async () => {
      const newPassword = 'NewValidPass123!';
      const passwordHistory = [
        '$2b$12$oldHash1',
        '$2b$12$oldHash2',
        '$2b$12$oldHash3',
      ];

      const password = await Password.createWithHistoryValidation(
        newPassword,
        passwordHistory,
      );

      expect(password).toBeInstanceOf(Password);
    });

    it('should reject password that matches recent history', async () => {
      const reusedPassword = 'ReusedPass123!';

      // Create a hash for the reused password
      const existingPassword = await Password.create(reusedPassword);
      const passwordHistory = [
        existingPassword.getHashedValue(), // This should match
        '$2b$12$oldHash2',
        '$2b$12$oldHash3',
      ];

      await expect(
        Password.createWithHistoryValidation(reusedPassword, passwordHistory),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );
    });

    it('should handle empty password history', async () => {
      const newPassword = 'NewValidPass123!';
      const emptyHistory: string[] = [];

      const password = await Password.createWithHistoryValidation(
        newPassword,
        emptyHistory,
      );

      expect(password).toBeInstanceOf(Password);
    });

    it('should handle password history with fewer than 5 entries', async () => {
      const newPassword = 'NewValidPass123!';
      const shortHistory = ['$2b$12$oldHash1', '$2b$12$oldHash2'];

      const password = await Password.createWithHistoryValidation(
        newPassword,
        shortHistory,
      );

      expect(password).toBeInstanceOf(Password);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters correctly', async () => {
      const specialChars = 'ValidPass123@#$%^&*()';
      const password = await Password.create(specialChars);

      expect(password).toBeInstanceOf(Password);
      expect(await password.verify(specialChars)).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodePassword = 'ValidPass123!ñáéíóú';
      const password = await Password.create(unicodePassword);

      expect(password).toBeInstanceOf(Password);
      expect(await password.verify(unicodePassword)).toBe(true);
    });

    it('should be case sensitive', async () => {
      const password = await Password.create('ValidPass123!');

      expect(await password.verify('validpass123!')).toBe(false);
      expect(await password.verify('VALIDPASS123!')).toBe(false);
    });
  });
});
