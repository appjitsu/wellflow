import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { equipment } from './equipment';
import { vendors } from './vendors';

/**
 * Maintenance Types
 */
export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'preventive',
  'inspection',
  'repair',
]);

/**
 * Maintenance Status
 */
export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

/**
 * Maintenance Schedules table - Preventive maintenance and work order tracking
 */
export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Multi-tenant org context
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),

    // Associations
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id),
    vendorId: uuid('vendor_id').references(() => vendors.id),

    // Scheduling
    maintenanceType: maintenanceTypeEnum('maintenance_type')
      .notNull()
      .default('preventive'),
    scheduleDate: date('schedule_date'),
    workOrderNumber: varchar('work_order_number', { length: 100 }),
    status: maintenanceStatusEnum('status').notNull().default('scheduled'),

    // Costs & downtime
    estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 12, scale: 2 }),
    downtimeHours: decimal('downtime_hours', { precision: 6, scale: 2 }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('maintenance_org_idx').on(table.organizationId),
    eqIdx: index('maintenance_equipment_idx').on(table.equipmentId),
    vendorIdx: index('maintenance_vendor_idx').on(table.vendorId),
    dateIdx: index('maintenance_date_idx').on(table.scheduleDate),
    statusIdx: index('maintenance_status_idx').on(table.status),
  }),
);
