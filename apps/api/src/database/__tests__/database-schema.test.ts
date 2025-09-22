/**
 * Database Schema Tests
 *
 * Tests for validating database table structure, constraints, and schema integrity
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';

describe('Database Schema Tests', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Use test database configuration
    const testDbConfig = {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5433'),
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password',
      database: process.env.TEST_DB_NAME || 'wellflow_test',
    };

    pool = new Pool(testDbConfig);
    db = drizzle(pool, { schema });

    // The database and migrations are already set up by the global setup
    // Just verify the connection works
    console.log(`🔧 Connected to test database: ${testDbConfig.database}`);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Table Structure Validation', () => {
    test('should have all required tables', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableNames = result.rows.map((row) => row.table_name);

      const expectedTables = [
        // Core Business Entities
        'organizations',
        'users',
        'leases',
        'wells',
        'production_records',
        'partners',
        'lease_partners',
        'compliance_reports',
        'jib_statements',
        'documents',
        'equipment',
        'well_tests',
        // Phase 1A: Financial Foundation
        'afes',
        'afe_line_items',
        'afe_approvals',
        'division_orders',
        'revenue_distributions',
        'lease_operating_statements',
        'vendors',
        'vendor_contacts',
        // Phase 1B: Legal & Environmental
        'title_opinions',
        'curative_items',
        'environmental_incidents',
        'spill_reports',
        // Phase 2: Operational Foundation
        'regulatory_filings',
        'compliance_schedules',
      ];

      expectedTables.forEach((tableName) => {
        expect(tableNames).toContain(tableName);
      });
    });

    test('organizations table should have correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'organizations'
        ORDER BY ordinal_position
      `);

      const columns = result.rows;

      expect(columns.find((c) => c.column_name === 'id')).toMatchObject({
        data_type: 'uuid',
        is_nullable: 'NO',
      });

      expect(columns.find((c) => c.column_name === 'name')).toMatchObject({
        data_type: 'character varying',
        is_nullable: 'NO',
      });

      expect(columns.find((c) => c.column_name === 'created_at')).toMatchObject(
        {
          data_type: 'timestamp without time zone',
          is_nullable: 'NO',
        },
      );
    });

    test('wells table should have API number constraints', async () => {
      const result = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'wells'
        AND constraint_type IN ('CHECK', 'UNIQUE')
      `);

      const constraints = result.rows;

      // Should have unique constraint on API number
      expect(constraints.some((c) => c.constraint_type === 'UNIQUE')).toBe(
        true,
      );
    });

    test('production_records table should have volume constraints', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'production_records'
        AND column_name IN ('oil_volume', 'gas_volume', 'water_volume')
      `);

      expect(result.rows).toHaveLength(3);
      result.rows.forEach((row) => {
        expect(row.data_type).toBe('numeric'); // Stored as numeric for precision
      });
    });
  });

  describe('Primary Key Validation', () => {
    test('all tables should have UUID primary keys', async () => {
      const result = await pool.query(`
        SELECT t.table_name, c.column_name, c.data_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        JOIN information_schema.key_column_usage k ON c.table_name = k.table_name 
          AND c.column_name = k.column_name
        JOIN information_schema.table_constraints tc ON k.constraint_name = tc.constraint_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND tc.constraint_type = 'PRIMARY KEY'
        AND t.table_name != '__drizzle_migrations'
        ORDER BY t.table_name
      `);

      result.rows.forEach((row) => {
        expect(row.column_name).toBe('id');
        expect(row.data_type).toBe('uuid');
      });
    });
  });

  describe('Foreign Key Validation', () => {
    test('should have proper foreign key relationships', async () => {
      const result = await pool.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, kcu.column_name
      `);

      const foreignKeys = result.rows;

      // Verify key relationships
      expect(
        foreignKeys.find(
          (fk) =>
            fk.table_name === 'users' &&
            fk.column_name === 'organization_id' &&
            fk.foreign_table_name === 'organizations',
        ),
      ).toBeDefined();

      expect(
        foreignKeys.find(
          (fk) =>
            fk.table_name === 'wells' &&
            fk.column_name === 'organization_id' &&
            fk.foreign_table_name === 'organizations',
        ),
      ).toBeDefined();

      expect(
        foreignKeys.find(
          (fk) =>
            fk.table_name === 'production_records' &&
            fk.column_name === 'well_id' &&
            fk.foreign_table_name === 'wells',
        ),
      ).toBeDefined();
    });
  });

  describe('Index Validation', () => {
    test('should have performance indexes on key columns', async () => {
      const result = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('organizations', 'users', 'wells', 'production_records')
        ORDER BY tablename, indexname
      `);

      const indexes = result.rows;

      // Should have indexes on foreign key columns
      expect(
        indexes.some(
          (idx) =>
            idx.tablename === 'users' &&
            idx.indexdef.includes('organization_id'),
        ),
      ).toBe(true);

      expect(
        indexes.some(
          (idx) =>
            idx.tablename === 'production_records' &&
            idx.indexdef.includes('well_id'),
        ),
      ).toBe(true);
    });
  });

  describe('Data Type Validation', () => {
    test('timestamp columns should have proper timezone handling', async () => {
      const result = await pool.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE column_name IN ('created_at', 'updated_at')
        AND table_schema = 'public'
        ORDER BY table_name, column_name
      `);

      result.rows.forEach((row) => {
        expect(row.data_type).toBe('timestamp without time zone');
      });
    });

    test('JSONB columns should be properly typed', async () => {
      const result = await pool.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE data_type = 'jsonb'
        AND table_schema = 'public'
        ORDER BY table_name, column_name
      `);

      // Should have JSONB columns for flexible data
      expect(result.rows.length).toBeGreaterThan(0);

      const expectedJsonbColumns = [
        { table_name: 'organizations', column_name: 'address' },
        { table_name: 'organizations', column_name: 'settings' },
        { table_name: 'equipment', column_name: 'specifications' },
      ];

      expectedJsonbColumns.forEach((expected) => {
        expect(
          result.rows.some(
            (row) =>
              row.table_name === expected.table_name &&
              row.column_name === expected.column_name,
          ),
        ).toBe(true);
      });
    });
  });
});
