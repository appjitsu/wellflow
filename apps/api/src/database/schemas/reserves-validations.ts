import {
  pgTable,
  uuid,
  timestamp,
  text,
  date,
  index,
  pgEnum,
  check,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { reserves } from './reserves';
import { partners } from './partners';
import { users } from './users';

export const reservesValidationStatusEnum = pgEnum(
  'reserves_validation_status',
  ['REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'],
);

/**
 * Reserves Validations - Third-party reserves validation workflow tracking
 */
export const reservesValidations = pgTable(
  'reserves_validations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    reservesId: uuid('reserves_id')
      .notNull()
      .references(() => reserves.id),
    validatorPartnerId: uuid('validator_partner_id').references(
      () => partners.id,
    ),
    requestedByUserId: uuid('requested_by_user_id')
      .notNull()
      .references(() => users.id),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    status: reservesValidationStatusEnum('status')
      .notNull()
      .default('REQUESTED'),
    requestDate: date('request_date').notNull(),
    reviewDate: date('review_date'),
    comments: text('comments'),
    findings: text('findings'),
    documents: jsonb('documents'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    organizationIdx: index('reserves_validations_organization_idx').on(
      table.organizationId,
    ),
    reservesIdx: index('reserves_validations_reserves_idx').on(
      table.reservesId,
    ),
    statusIdx: index('reserves_validations_status_idx').on(table.status),
    requestDateIdx: index('reserves_validations_request_date_idx').on(
      table.requestDate,
    ),
    chronologicCheck: check(
      'reserves_validations_review_after_request_check',
      sql`review_date IS NULL OR review_date >= request_date`,
    ),
  }),
);
