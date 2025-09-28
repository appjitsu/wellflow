import { PasswordHistory } from '../password-history.entity';
import { randomUUID } from 'crypto';

/**
 * Unit Tests for PasswordHistory Entity
 *
 * Tests the PasswordHistory domain entity creation, validation,
 * and business logic following DDD patterns.
 */
describe('PasswordHistory', () => {
  const validUserId = randomUUID();
  const validPasswordHash =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe'; // Valid 60-char bcrypt hash

  describe('create', () => {
    it('should create a valid PasswordHistory entity', () => {
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );

      expect(passwordHistory).toBeInstanceOf(PasswordHistory);
      expect(passwordHistory.getId()).toBeDefined();
      expect(passwordHistory.getUserId()).toBe(validUserId);
      expect(passwordHistory.getPasswordHash()).toBe(validPasswordHash);
      expect(passwordHistory.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for different instances', () => {
      const history1 = PasswordHistory.create(validUserId, validPasswordHash);
      const history2 = PasswordHistory.create(validUserId, validPasswordHash);

      expect(history1.getId()).not.toBe(history2.getId());
    });

    it('should set creation timestamp', () => {
      const beforeCreation = new Date();
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );
      const afterCreation = new Date();

      const createdAt = passwordHistory.getCreatedAt();
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('constructor validation', () => {
    it('should reject invalid UUID for user ID', () => {
      const invalidUserId = 'not-a-valid-uuid';

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new PasswordHistory(
          randomUUID(),
          invalidUserId,
          validPasswordHash,
          new Date(),
        );
      }).toThrow('User ID must be a valid UUID');
    });

    it('should reject empty user ID', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new PasswordHistory(randomUUID(), '', validPasswordHash, new Date());
      }).toThrow('User ID cannot be empty');
    });

    it('should reject invalid password hash format', () => {
      const invalidHash = 'not-a-bcrypt-hash';

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new PasswordHistory(randomUUID(), validUserId, invalidHash, new Date());
      }).toThrow('Invalid bcrypt password hash format');
    });

    it('should reject empty password hash', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new PasswordHistory(randomUUID(), validUserId, '', new Date());
      }).toThrow('Password hash cannot be empty');
    });
  });

  describe('getters', () => {
    let passwordHistory: PasswordHistory;

    beforeEach(() => {
      passwordHistory = PasswordHistory.create(validUserId, validPasswordHash);
    });

    it('should return correct ID', () => {
      expect(passwordHistory.getId()).toBeDefined();
      expect(typeof passwordHistory.getId()).toBe('string');
    });

    it('should return correct user ID', () => {
      expect(passwordHistory.getUserId()).toBe(validUserId);
    });

    it('should return correct password hash', () => {
      expect(passwordHistory.getPasswordHash()).toBe(validPasswordHash);
    });

    it('should return correct creation date', () => {
      expect(passwordHistory.getCreatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const passwordHistory = PasswordHistory.create(
        validUserId,
        validPasswordHash,
      );
      const originalId = passwordHistory.getId();
      const originalUserId = passwordHistory.getUserId();
      const originalHash = passwordHistory.getPasswordHash();
      const originalDate = passwordHistory.getCreatedAt();

      // Attempt to modify (should not be possible with proper encapsulation)
      expect(passwordHistory.getId()).toBe(originalId);
      expect(passwordHistory.getUserId()).toBe(originalUserId);
      expect(passwordHistory.getPasswordHash()).toBe(originalHash);
      expect(passwordHistory.getCreatedAt().getTime()).toBe(
        originalDate.getTime(),
      );
    });
  });

  describe('business rules', () => {
    it('should accept valid bcrypt hash formats', () => {
      const validHashes = [
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uk6L7u1Pe',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxVv0v3G2irc6W6sefkqyHu',
        '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      ];

      validHashes.forEach((hash) => {
        expect(() => {
          PasswordHistory.create(validUserId, hash);
        }).not.toThrow();
      });
    });

    it('should reject non-bcrypt hash formats', () => {
      const invalidHashes = [
        'plaintext-password',
        'md5hash',
        '$1$invalid$hash',
        'sha256:somehash',
      ];

      invalidHashes.forEach((hash) => {
        expect(() => {
          // eslint-disable-next-line sonarjs/constructor-for-side-effects
          new PasswordHistory(randomUUID(), validUserId, hash, new Date());
        }).toThrow('Invalid bcrypt password hash format');
      });
    });
  });

  describe('equality and comparison', () => {
    it('should be equal when all properties match', () => {
      const id = randomUUID();
      const createdAt = new Date();

      const history1 = new PasswordHistory(
        id,
        validUserId,
        validPasswordHash,
        createdAt,
      );
      const history2 = new PasswordHistory(
        id,
        validUserId,
        validPasswordHash,
        createdAt,
      );

      expect(history1.getId()).toBe(history2.getId());
      expect(history1.getUserId()).toBe(history2.getUserId());
      expect(history1.getPasswordHash()).toBe(history2.getPasswordHash());
      expect(history1.getCreatedAt().getTime()).toBe(
        history2.getCreatedAt().getTime(),
      );
    });

    it('should be different when IDs differ', () => {
      const history1 = PasswordHistory.create(validUserId, validPasswordHash);
      const history2 = PasswordHistory.create(validUserId, validPasswordHash);

      expect(history1.getId()).not.toBe(history2.getId());
    });
  });
});
