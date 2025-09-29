import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Token Blacklist table - Tracks blacklisted JWT tokens for secure logout
 *
 * Security Requirements:
 * - Prevents reuse of logged-out JWT tokens
 * - Automatic cleanup of expired tokens
 * - Efficient lookup for token validation
 * - Indexed for performance
 *
 * Business Rules:
 * - Each blacklisted token is stored with its JTI (JWT ID)
 * - Tokens are automatically cleaned up after expiration
 * - Both access and refresh tokens can be blacklisted
 * - User ID is stored for audit purposes
 */
export const tokenBlacklist = pgTable(
  'token_blacklist',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // JWT Token Identifier (jti claim from JWT)
    jti: varchar('jti', { length: 255 }).notNull(),

    // User who owned the token (for audit purposes)
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Token type for categorization
    tokenType: varchar('token_type', { length: 50 }).notNull(), // 'access' | 'refresh'

    // When the token was blacklisted
    blacklistedAt: timestamp('blacklisted_at').defaultNow().notNull(),

    // When the token expires (for cleanup)
    expiresAt: timestamp('expires_at').notNull(),

    // Reason for blacklisting (logout, security, etc.)
    reason: varchar('reason', { length: 100 }).notNull().default('logout'),

    // IP address where logout occurred (for audit)
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible

    // User agent for audit trail
    userAgent: varchar('user_agent', { length: 500 }),
  },
  (table) => ({
    // Primary index for token lookup (most important for performance)
    jtiIdx: index('token_blacklist_jti_idx').on(table.jti),

    // Index for user-specific queries
    userIdIdx: index('token_blacklist_user_id_idx').on(table.userId),

    // Index for cleanup operations (expired tokens)
    expiresAtIdx: index('token_blacklist_expires_at_idx').on(table.expiresAt),

    // Composite index for efficient user + token type queries
    userIdTokenTypeIdx: index('token_blacklist_user_id_token_type_idx').on(
      table.userId,
      table.tokenType,
    ),
  }),
);

// Type inference for TypeScript
export type TokenBlacklist = typeof tokenBlacklist.$inferSelect;
export type NewTokenBlacklist = typeof tokenBlacklist.$inferInsert;
