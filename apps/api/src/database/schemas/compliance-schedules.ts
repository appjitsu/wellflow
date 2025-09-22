import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';

/**
 * Compliance Schedules table - Automated compliance deadline tracking
 */
export const complianceSchedules = pgTable(
  'compliance_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    wellId: uuid('well_id').references(() => wells.id),
    complianceType: varchar('compliance_type', { length: 50 }).notNull(), // permit_renewal|inspection|filing|testing
    title: varchar('title', { length: 255 }).notNull(),
    regulatoryAgency: varchar('regulatory_agency', { length: 50 }).notNull(),
    dueDate: date('due_date').notNull(),
    frequency: varchar('frequency', { length: 20 }), // one_time|monthly|quarterly|annual
    nextDueDate: date('next_due_date'),
    priority: varchar('priority', { length: 10 }).notNull().default('medium'), // low|medium|high|critical
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending|in_progress|completed|overdue
    isRecurring: boolean('is_recurring').default(false).notNull(),
    completionDate: date('completion_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // eslint-disable-next-line no-secrets/no-secrets
    organizationIdx: index('compliance_schedules_organization_id_idx').on(
      table.organizationId,
    ),

    wellIdx: index('compliance_schedules_well_id_idx').on(table.wellId),

    complianceTypeIdx: index('compliance_schedules_compliance_type_idx').on(
      table.complianceType,
    ),

    dueDateIdx: index('compliance_schedules_due_date_idx').on(table.dueDate),

    statusIdx: index('compliance_schedules_status_idx').on(table.status),
    priorityIdx: index('compliance_schedules_priority_idx').on(table.priority), // eslint-disable-line no-secrets/no-secrets

    recurringIdx: index('compliance_schedules_is_recurring_idx').on(
      table.isRecurring,
    ),
  }),
);
