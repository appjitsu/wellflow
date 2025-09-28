import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Password History table - Tracks user password history for security
 *
 * Security Requirements:
 * - Prevents reuse of last 5 passwords
 * - Stores bcrypt hashed passwords only
 * - Automatic cleanup of old entries beyond 5 most recent
 * - Indexed for efficient password history lookups
 *
 * Business Rules:
 * - Each user can have maximum 5 password history entries
 * - Passwords are stored as bcrypt hashes (never plain text)
 * - Entries are ordered by createdAt for efficient retrieval
 * - Old entries beyond 5 are automatically cleaned up
 */
export const passwordHistory = pgTable(
  'password_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Store the bcrypt hash of the password (never plain text)
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    // Timestamp when this password was set
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index for efficient user password history lookups
    userIdCreatedAtIdx: index('password_history_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc(),
    ),

    // Index for user-specific queries
    userIdIdx: index('password_history_user_id_idx').on(table.userId),
  }),
);
