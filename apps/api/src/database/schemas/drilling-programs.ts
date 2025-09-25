import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { wells } from './wells';
import { afes } from './afes';
import { users } from './users';

/**
 * Drilling Program Status Enum
 */
export const drillingProgramStatusEnum = pgEnum('drilling_program_status', [
  'draft',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Drilling Programs table - Well planning and execution tracking
 * Includes cost estimation/actuals, engineering programs, hazards, and approvals
 */
export const drillingPrograms = pgTable(
  'drilling_programs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant org context
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),

    // Associations
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    afeId: uuid('afe_id').references(() => afes.id),

    // Program identity and lifecycle
    programName: varchar('program_name', { length: 255 }).notNull(),
    version: integer('version').notNull().default(1),
    status: drillingProgramStatusEnum('status').notNull().default('draft'),

    // Costing
    estimatedTotalCost: jsonb('estimated_total_cost'), // {currency: 'USD', value: 12345.67}
    actualTotalCost: jsonb('actual_total_cost'),

    // Engineering programs (flexible JSON payloads)
    casingProgram: jsonb('casing_program'),
    mudProgram: jsonb('mud_program'),
    bitProgram: jsonb('bit_program'),
    cementProgram: jsonb('cement_program'),
    directionalPlan: jsonb('directional_plan'),
    formationTops: jsonb('formation_tops'),

    // Risk & HSE
    hazardAnalysis: jsonb('hazard_analysis'),
    riskAssessment: jsonb('risk_assessment'),

    // Approvals & workflow timestamps
    submittedAt: timestamp('submitted_at'),
    submittedByUserId: uuid('submitted_by_user_id').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('drilling_programs_org_idx').on(table.organizationId),
    wellIdx: index('drilling_programs_well_idx').on(table.wellId),
    afeIdx: index('drilling_programs_afe_idx').on(table.afeId),
    statusIdx: index('drilling_programs_status_idx').on(table.status),
  }),
);
