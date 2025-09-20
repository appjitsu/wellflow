'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.wells = void 0;
var pg_core_1 = require('drizzle-orm/pg-core');
exports.wells = (0, pg_core_1.pgTable)(
  'wells',
  {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    apiNumber: (0, pg_core_1.varchar)('api_number', { length: 12 })
      .notNull()
      .unique(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    operatorId: (0, pg_core_1.uuid)('operator_id').notNull(),
    leaseId: (0, pg_core_1.uuid)('lease_id'),
    wellType: (0, pg_core_1.varchar)('well_type', { length: 50 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(),
    location: (0, pg_core_1.jsonb)('location').notNull(),
    spudDate: (0, pg_core_1.timestamp)('spud_date'),
    completionDate: (0, pg_core_1.timestamp)('completion_date'),
    totalDepth: (0, pg_core_1.integer)('total_depth'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    version: (0, pg_core_1.integer)('version').default(1).notNull(),
  },
  function (table) {
    return {
      apiNumberIdx: (0, pg_core_1.index)('wells_api_number_idx').on(
        table.apiNumber,
      ),
      operatorIdx: (0, pg_core_1.index)('wells_operator_id_idx').on(
        table.operatorId,
      ),
      leaseIdx: (0, pg_core_1.index)('wells_lease_id_idx').on(table.leaseId),
      statusIdx: (0, pg_core_1.index)('wells_status_idx').on(table.status),
      locationIdx: (0, pg_core_1.index)('wells_location_idx').on(
        table.location,
      ),
    };
  },
);
