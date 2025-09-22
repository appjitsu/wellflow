/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
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
  }),
);
