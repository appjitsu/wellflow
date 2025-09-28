import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email';
import { AuthUserRepository } from '../auth.service';
import { users } from '../../database/schemas/users';
import { DatabaseService } from '../../database/database.service';

/**
 * Authentication User Repository Implementation
 *
 * Implements the AuthUserRepository interface using Drizzle ORM
 * Follows the established Repository pattern in the codebase
 * Maps between domain entities and database schema
 */
@Injectable()
export class AuthUserRepositoryImpl implements AuthUserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const emailVO = Email.create(email);

      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, emailVO.getValue()))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const user = result[0];
      if (!user) {
        return null;
      }

      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const user = result[0];
      if (!user) {
        return null;
      }

      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Save user (create or update)
   */
  async save(user: User): Promise<User> {
    try {
      const userData = this.mapToSchema(user);

      // Check if user exists
      const existing = await this.findById(user.getId());

      const db = this.databaseService.getDb();
      if (existing) {
        // Update existing user
        await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.getId()));
      } else {
        // Insert new user
        await db.insert(users).values(userData);
      }

      // Return the saved user
      const savedUser = await this.findById(user.getId());
      if (!savedUser) {
        throw new Error('Failed to save user');
      }

      return savedUser;
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error(
        `Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const emailVO = Email.create(email);

      const db = this.databaseService.getDb();
      const result = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, emailVO.getValue()))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking user existence by email:', error);
      return false;
    }
  }

  /**
   * Map database row to domain entity
   */
  private mapToEntity(row: typeof users.$inferSelect): User {
    return User.fromDatabase(
      row.id,
      row.organizationId,
      row.email,
      row.firstName,
      row.lastName,
      row.role as UserRole,
      row.phone || undefined,
      row.passwordHash || '',
      row.emailVerified,
      row.emailVerificationToken,
      row.emailVerificationExpiresAt,
      row.failedLoginAttempts,
      row.lockedUntil,
      row.lockoutCount,
      row.passwordResetToken,
      row.passwordResetExpiresAt,
      row.isActive,
      row.lastLoginAt,
      row.createdAt,
      row.updatedAt,
    );
  }

  /**
   * Map domain entity to database schema
   */
  private mapToSchema(user: User): typeof users.$inferInsert {
    return {
      id: user.getId(),
      organizationId: user.getOrganizationId(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      role: user.getRole(),
      phone: user.getPhone(),
      passwordHash: user.getPasswordHash(),
      emailVerified: user.isEmailVerified(),
      emailVerificationToken: user.getEmailVerificationToken(),
      emailVerificationExpiresAt: user.getEmailVerificationExpiresAt(),
      failedLoginAttempts: user.getFailedLoginAttempts(),
      lockedUntil: user.getLockedUntil(),
      lockoutCount: user.getLockoutCount(),
      passwordResetToken: user.getPasswordResetToken(),
      passwordResetExpiresAt: user.getPasswordResetExpiresAt(),
      isActive: user.isAccountActive(),
      lastLoginAt: user.getLastLoginAt(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }
}
