import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { afes } from './afes';
import { partners } from './partners';
import { users } from './users';

/**
 * AFE Approvals table - Partner approval tracking for AFEs
 */
export const afeApprovals = pgTable(
  'afe_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    afeId: uuid('afe_id')
      .notNull()
      .references(() => afes.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id),
    approvalStatus: varchar('approval_status', { length: 20 }).notNull(), // pending|approved|rejected|conditional
    approvedAmount: decimal('approved_amount', { precision: 12, scale: 2 }),
    approvalDate: timestamp('approval_date'),
    comments: text('comments'),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    afeIdx: index('afe_approvals_afe_id_idx').on(table.afeId),
    partnerIdx: index('afe_approvals_partner_id_idx').on(table.partnerId),
    statusIdx: index('afe_approvals_approval_status_idx').on(
      table.approvalStatus,
    ),
    afePartnerUnique: unique('afe_approvals_afe_partner_unique').on(
      table.afeId,
      table.partnerId,
    ),
  }),
);
