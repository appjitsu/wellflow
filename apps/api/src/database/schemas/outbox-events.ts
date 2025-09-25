import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';

/**
 * Outbox Events table - reliable event publishing
 */
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id'),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  eventType: varchar('event_type', { length: 150 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|processed|failed
  attempts: integer('attempts').notNull().default(0),
  error: varchar('error', { length: 2000 }),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});
