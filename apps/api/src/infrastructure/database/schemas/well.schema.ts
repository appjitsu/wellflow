/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Wells table schema
 * Database schema for storing well data
 */
export const wells = pgTable(
  'wells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apiNumber: varchar('api_number', { length: 14 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    operatorId: uuid('operator_id').notNull(),
    leaseId: uuid('lease_id'),
    wellType: varchar('well_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    location: jsonb('location').notNull(),
    spudDate: timestamp('spud_date'),
    completionDate: timestamp('completion_date'),
    totalDepth: integer('total_depth'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    version: integer('version').default(1).notNull(),
  },
  (table) => ({
    apiNumberIdx: index('wells_api_number_idx').on(table.apiNumber),
    operatorIdx: index('wells_operator_id_idx').on(table.operatorId),
    leaseIdx: index('wells_lease_id_idx').on(table.leaseId),
    statusIdx: index('wells_status_idx').on(table.status),
    locationIdx: index('wells_location_idx').on(table.location),
  }),
);
