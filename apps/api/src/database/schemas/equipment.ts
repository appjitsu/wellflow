import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { wells } from './wells';

/**
 * Equipment table - Well equipment inventory and management
 */
export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .notNull()
      .references(() => wells.id),
    equipmentName: varchar('equipment_name', { length: 255 }).notNull(),
    equipmentType: varchar('equipment_type', { length: 50 }).notNull(), // pump|tank|meter|separator
    manufacturer: varchar('manufacturer', { length: 100 }),
    model: varchar('model', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    installationDate: date('installation_date'),
    specifications: jsonb('specifications'),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active|maintenance|retired
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    wellIdx: index('equipment_well_id_idx').on(table.wellId),
    equipmentTypeIdx: index('equipment_equipment_type_idx').on(
      table.equipmentType,
    ),
    statusIdx: index('equipment_status_idx').on(table.status),
    serialNumberIdx: index('equipment_serial_number_idx').on(
      table.serialNumber,
    ),
  }),
);
