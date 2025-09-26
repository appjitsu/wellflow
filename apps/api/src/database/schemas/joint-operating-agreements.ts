import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  decimal,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Joint Operating Agreements (JOAs) - Terms and accounting procedures
 */
export const jointOperatingAgreements = pgTable(
  'joint_operating_agreements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),

    agreementNumber: varchar('agreement_number', { length: 100 }).notNull(),
    effectiveDate: date('effective_date').notNull(),
    endDate: date('end_date'),

    operatorOverheadPercent: decimal('operator_overhead_percent', {
      precision: 5,
      scale: 2,
    }).default('0'),

    votingThresholdPercent: decimal('voting_threshold_percent', {
      precision: 5,
      scale: 2,
    }).default('50.0'),

    nonConsentPenaltyPercent: decimal('non_consent_penalty_percent', {
      precision: 5,
      scale: 2,
    }).default('0'),

    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE | TERMINATED | SUSPENDED

    terms: jsonb('terms'), // structured summary of key clauses

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('joa_org_idx').on(table.organizationId),
    statusIdx: index('joa_status_idx').on(table.status),
    orgAgreementUnique: unique('joa_org_agreement_unique').on(
      table.organizationId,
      table.agreementNumber,
    ),
  }),
);
