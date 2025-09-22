/* eslint-disable sonarjs/deprecation */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { leases } from './leases';

/**
 * Title Opinions table - Legal title examination records
 */
export const titleOpinions = pgTable(
  'title_opinions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    leaseId: uuid('lease_id')
      .notNull()
      .references(() => leases.id),
    opinionNumber: varchar('opinion_number', { length: 50 }).notNull(),
    examinerName: varchar('examiner_name', { length: 255 }).notNull(),
    examinationDate: date('examination_date').notNull(),
    effectiveDate: date('effective_date').notNull(),
    titleStatus: varchar('title_status', { length: 20 }).notNull(), // clear|defective|pending
    findings: text('findings'),
    recommendations: text('recommendations'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('title_opinions_organization_id_idx').on(
      table.organizationId,
    ),
    leaseIdx: index('title_opinions_lease_id_idx').on(table.leaseId),
    opinionNumberIdx: index('title_opinions_opinion_number_idx').on(
      table.opinionNumber,
    ),
    titleStatusIdx: index('title_opinions_title_status_idx').on(
      table.titleStatus,
    ),
    examinationDateIdx: index('title_opinions_examination_date_idx').on(
      table.examinationDate,
    ),
  }),
);
