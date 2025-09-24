import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  date,
  integer,
  index,
  unique,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { leases } from './leases';

/**
 * AFE Type Enum - Types of Authorization for Expenditure
 */
export const afeTypeEnum = pgEnum('afe_type', [
  'drilling',
  'completion',
  'workover',
  'facility',
]);

/**
 * AFE Status Enum - Status of Authorization for Expenditure
 */
export const afeStatusEnum = pgEnum('afe_status', [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'closed',
]);

/**
 * AFEs table - Authorization for Expenditure management
 */
export const afes = pgTable(
  'afes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    afeNumber: varchar('afe_number', { length: 50 }).notNull(),
    wellId: uuid('well_id').references(() => wells.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    afeType: afeTypeEnum('afe_type').notNull(),
    status: afeStatusEnum('status').notNull().default('draft'),
    totalEstimatedCost: decimal('total_estimated_cost', {
      precision: 12,
      scale: 2,
    }),
    approvedAmount: decimal('approved_amount', { precision: 12, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
    effectiveDate: date('effective_date'),
    approvalDate: date('approval_date'),
    description: text('description'),
    submittedAt: timestamp('submitted_at'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('afes_organization_id_idx').on(table.organizationId),
    afeNumberIdx: index('afes_afe_number_idx').on(table.afeNumber),
    wellIdx: index('afes_well_id_idx').on(table.wellId),
    leaseIdx: index('afes_lease_id_idx').on(table.leaseId),
    statusIdx: index('afes_status_idx').on(table.status),
    afeTypeIdx: index('afes_afe_type_idx').on(table.afeType),
    orgAfeNumberUnique: unique('afes_org_afe_number_unique').on(
      table.organizationId,
      table.afeNumber,
    ),
  }),
);
