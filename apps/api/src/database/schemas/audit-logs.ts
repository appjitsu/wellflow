import { pgTable, uuid, text, jsonb, timestamp, inet, boolean, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Who performed the action
  userId: uuid('user_id'),
  organizationId: uuid('organization_id').references(() => organizations.id),

  // What action was performed
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, READ, EXECUTE, etc.
  resourceType: text('resource_type').notNull(), // Well, User, Organization, etc.
  resourceId: text('resource_id'), // ID of the resource being acted upon

  // When it happened
  timestamp: timestamp('timestamp').notNull().defaultNow(),

  // Where it came from
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),

  // What changed
  oldValues: jsonb('old_values'), // Previous state (for updates/deletes)
  newValues: jsonb('new_values'), // New state (for creates/updates)

  // Result
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),

  // Additional context
  metadata: jsonb('metadata'), // Additional context like session ID, correlation ID, etc.
  requestId: uuid('request_id'), // For request tracing
  endpoint: text('endpoint'), // API endpoint called
  method: text('method'), // HTTP method
  duration: text('duration'), // Operation duration in milliseconds

  // Audit trail
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'), // System user who logged this
}, (table) => ({
  // Indexes for efficient querying
  userIdx: index('audit_logs_user_idx').on(table.userId),
  organizationIdx: index('audit_logs_organization_idx').on(table.organizationId),
  resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
  requestIdx: index('audit_logs_request_idx').on(table.requestId),
  successIdx: index('audit_logs_success_idx').on(table.success),
}));
