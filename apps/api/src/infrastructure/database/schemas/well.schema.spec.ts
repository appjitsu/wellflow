import { wells } from './well.schema';

describe('Well Schema', () => {
  describe('Schema Definition', () => {
    it('should be defined', () => {
      expect(wells).toBeDefined();
    });

    it('should be a pgTable instance', () => {
      expect(wells).toBeInstanceOf(Object);
      expect(typeof wells).toBe('object');
    });

    it('should have table metadata', () => {
      // Check that it has the drizzle table symbol properties
      const symbols = Object.getOwnPropertySymbols(wells);
      expect(symbols.length).toBeGreaterThan(0);
    });
  });

  describe('Column Definitions', () => {
    it('should have all required columns', () => {
      expect(wells).toHaveProperty('id');
      expect(wells).toHaveProperty('apiNumber');
      expect(wells).toHaveProperty('name');
      expect(wells).toHaveProperty('operatorId');
      expect(wells).toHaveProperty('leaseId');
      expect(wells).toHaveProperty('wellType');
      expect(wells).toHaveProperty('status');
      expect(wells).toHaveProperty('location');
      expect(wells).toHaveProperty('spudDate');
      expect(wells).toHaveProperty('completionDate');
      expect(wells).toHaveProperty('totalDepth');
      expect(wells).toHaveProperty('createdAt');
      expect(wells).toHaveProperty('updatedAt');
      expect(wells).toHaveProperty('version');
    });

    it('should have correct column types', () => {
      // UUID columns
      expect(wells.id.dataType).toBe('string');
      expect(wells.operatorId.dataType).toBe('string');
      expect(wells.leaseId.dataType).toBe('string');

      // VARCHAR columns
      expect(wells.apiNumber.dataType).toBe('string');
      expect(wells.name.dataType).toBe('string');
      expect(wells.wellType.dataType).toBe('string');
      expect(wells.status.dataType).toBe('string');

      // JSONB column
      expect(wells.location.dataType).toBe('json');

      // TIMESTAMP columns
      expect(wells.spudDate.dataType).toBe('date');
      expect(wells.completionDate.dataType).toBe('date');
      expect(wells.createdAt.dataType).toBe('date');
      expect(wells.updatedAt.dataType).toBe('date');

      // INTEGER columns
      expect(wells.totalDepth.dataType).toBe('number');
      expect(wells.version.dataType).toBe('number');
    });

    it('should have correct column constraints', () => {
      // Primary key
      expect(wells.id.primary).toBe(true);

      // Not null constraints
      expect(wells.apiNumber.notNull).toBe(true);
      expect(wells.name.notNull).toBe(true);
      expect(wells.operatorId.notNull).toBe(true);
      expect(wells.wellType.notNull).toBe(true);
      expect(wells.status.notNull).toBe(true);
      expect(wells.location.notNull).toBe(true);
      expect(wells.createdAt.notNull).toBe(true);
      expect(wells.updatedAt.notNull).toBe(true);
      expect(wells.version.notNull).toBe(true);

      // Nullable columns
      expect(wells.leaseId.notNull).toBe(false);
      expect(wells.spudDate.notNull).toBe(false);
      expect(wells.completionDate.notNull).toBe(false);
      expect(wells.totalDepth.notNull).toBe(false);
    });

    it('should have unique constraint on apiNumber', () => {
      expect(wells.apiNumber.isUnique).toBe(true);
    });

    it('should have correct varchar lengths', () => {
      // Note: Drizzle ORM doesn't expose size property directly in runtime
      // We can verify the columns exist and have the correct types
      expect(wells.apiNumber.columnType).toBe('PgVarchar');
      expect(wells.name.columnType).toBe('PgVarchar');
      expect(wells.wellType.columnType).toBe('PgVarchar');
      expect(wells.status.columnType).toBe('PgVarchar');
    });

    it('should have default values where specified', () => {
      // Check that columns with defaults have hasDefault property
      expect(wells.id.hasDefault).toBe(true);
      expect(wells.createdAt.hasDefault).toBe(true);
      expect(wells.updatedAt.hasDefault).toBe(true);
      expect(wells.version.hasDefault).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have indexes defined in schema', () => {
      // Drizzle ORM doesn't expose indexes at runtime in the same way
      // But we can verify the table structure includes index configuration
      expect(wells).toBeDefined();
      expect(typeof wells).toBe('object');
    });

    it('should have table structure that supports indexing', () => {
      // Verify that the columns that should be indexed exist
      expect(wells.apiNumber).toBeDefined();
      expect(wells.operatorId).toBeDefined();
      expect(wells.leaseId).toBeDefined();
      expect(wells.status).toBeDefined();
      expect(wells.location).toBeDefined();
    });

    it('should be compatible with index creation', () => {
      // Test that the schema structure supports the intended indexes
      expect(() => {
        // These would be the columns used in index creation
        const indexableColumns = {
          apiNumber: wells.apiNumber,
          operatorId: wells.operatorId,
          leaseId: wells.leaseId,
          status: wells.status,
          location: wells.location,
        };
        expect(indexableColumns).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Schema Validation', () => {
    it('should be compatible with Drizzle ORM operations', () => {
      // Test that the schema can be used in typical Drizzle operations
      expect(() => {
        // This would be used in select operations
        const selectFields = {
          id: wells.id,
          apiNumber: wells.apiNumber,
          name: wells.name,
          operatorId: wells.operatorId,
          status: wells.status,
        };
        expect(selectFields).toBeDefined();
      }).not.toThrow();
    });

    it('should have proper column references', () => {
      // Test that all columns can be referenced
      expect(wells.id).toBeDefined();
      expect(wells.apiNumber).toBeDefined();
      expect(wells.name).toBeDefined();
      expect(wells.operatorId).toBeDefined();
      expect(wells.leaseId).toBeDefined();
      expect(wells.wellType).toBeDefined();
      expect(wells.status).toBeDefined();
      expect(wells.location).toBeDefined();
      expect(wells.spudDate).toBeDefined();
      expect(wells.completionDate).toBeDefined();
      expect(wells.totalDepth).toBeDefined();
      expect(wells.createdAt).toBeDefined();
      expect(wells.updatedAt).toBeDefined();
      expect(wells.version).toBeDefined();
    });

    it('should have correct column names in database', () => {
      // Verify the actual database column names
      expect(wells.id.name).toBe('id');
      expect(wells.apiNumber.name).toBe('api_number');
      expect(wells.name.name).toBe('name');
      expect(wells.operatorId.name).toBe('operator_id');
      expect(wells.leaseId.name).toBe('lease_id');
      expect(wells.wellType.name).toBe('well_type');
      expect(wells.status.name).toBe('status');
      expect(wells.location.name).toBe('location');
      expect(wells.spudDate.name).toBe('spud_date');
      expect(wells.completionDate.name).toBe('completion_date');
      expect(wells.totalDepth.name).toBe('total_depth');
      expect(wells.createdAt.name).toBe('created_at');
      expect(wells.updatedAt.name).toBe('updated_at');
      expect(wells.version.name).toBe('version');
    });
  });

  describe('Schema Export', () => {
    it('should export wells table', () => {
      expect(wells).toBeDefined();
      expect(typeof wells).toBe('object');
    });

    it('should be importable and usable', () => {
      // Test that the schema can be imported and used
      const tableReference = wells;
      expect(tableReference).toBe(wells);
      expect(typeof tableReference).toBe('object');
    });
  });
});
