import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Organizations table - Multi-tenant root entity
 * Represents oil & gas operator companies
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  taxId: varchar('tax_id', { length: 50 }),
  address: jsonb('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  // Regulatory identifiers and contacts (TX RRC)
  txRrcOperatorNumber: varchar('tx_rrc_operator_number', { length: 20 }),
  txRrcAgentId: varchar('tx_rrc_agent_id', { length: 50 }),
  regulatoryContactName: varchar('regulatory_contact_name', { length: 255 }),
  regulatoryContactEmail: varchar('regulatory_contact_email', { length: 255 }),
  regulatoryContactPhone: varchar('regulatory_contact_phone', { length: 20 }),
  settings: jsonb('settings').default('{}').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
