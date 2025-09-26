import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * User role enum - Defines the available user roles in the system
 */
export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'pumper']);

/**
 * Users table - System users with role-based access control
 * Roles: owner, manager, pumper
 *
 * Authentication fields:
 * - passwordHash: Bcrypt hashed password
 * - emailVerified: Email verification status
 * - emailVerificationToken: Token for email verification
 * - emailVerificationExpiresAt: Expiration for verification token
 * - failedLoginAttempts: Counter for account lockout protection
 * - lockedUntil: Account lockout expiration timestamp
 * - passwordResetToken: Token for password reset
 * - passwordResetExpiresAt: Expiration for password reset token
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull(),
    phone: varchar('phone', { length: 20 }),

    // Authentication fields
    passwordHash: varchar('password_hash', { length: 255 }),
    emailVerified: boolean('email_verified').default(false).notNull(),
    emailVerificationToken: varchar('email_verification_token', {
      length: 255,
    }),
    emailVerificationExpiresAt: timestamp('email_verification_expires_at'),

    // Account lockout protection (Sprint 3 requirement: 5 failed attempts)
    failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
    lockedUntil: timestamp('locked_until'),

    // Password reset functionality
    passwordResetToken: varchar('password_reset_token', { length: 255 }),
    passwordResetExpiresAt: timestamp('password_reset_expires_at'),

    // System fields
    isActive: boolean('is_active').default(true).notNull(),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: unique('users_email_unique').on(table.email),
    organizationIdx: index('users_organization_id_idx').on(
      table.organizationId,
    ),
    emailVerificationTokenIdx: index('users_email_verification_token_idx').on(
      table.emailVerificationToken,
    ),
    passwordResetTokenIdx: index('users_password_reset_token_idx').on(
      table.passwordResetToken,
    ),
  }),
);
