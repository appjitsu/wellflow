# WellFlow Database Testing Suite

Comprehensive testing suite for the WellFlow oil & gas production management database models.

## 🎯 Overview

This testing suite validates the complete database implementation including:

- **Schema Validation**: Table structure, constraints, and data types
- **CRUD Operations**: Create, Read, Update, Delete for all models
- **Business Rules**: Oil & gas industry-specific validations
- **Relationships**: Foreign keys, joins, and data integrity
- **Seed Data**: Development data creation and validation
- **Performance**: Query optimization and indexing

## 📋 Test Categories

### 1. Schema Tests (`database-schema.test.ts`)

- ✅ Table structure validation
- ✅ Primary key constraints (UUID)
- ✅ Foreign key relationships
- ✅ Index validation for performance
- ✅ Data type validation (timestamps, JSONB)
- ✅ Constraint validation

### 2. CRUD Tests (`database-crud.test.ts`)

- ✅ Organization management
- ✅ User management with RBAC
- ✅ Well management with API numbers
- ✅ Production record management
- ✅ Multi-tenant data isolation
- ✅ Audit trail functionality

### 3. Business Rules Tests (`database-business-rules.test.ts`)

- ✅ API number format validation (14-digit format)
- ✅ Production volume constraints (non-negative)
- ✅ Partnership percentage validations
- ✅ Well status transitions
- ✅ User role enforcement
- ✅ Audit trail timestamps

### 4. Relationships Tests (`database-relationships.test.ts`)

- ✅ Organization → Users (1:many)
- ✅ Organization → Wells (1:many)
- ✅ Wells → Production Records (1:many)
- ✅ Wells → Equipment (1:many)
- ✅ Leases ↔ Partners (many:many)
- ✅ Complex multi-table queries
- ✅ Foreign key constraint enforcement

### 5. Seed Data Tests (`database-seed.test.ts`)

- ✅ Seed script execution
- ✅ Sample data creation
- ✅ Referential integrity
- ✅ Realistic data validation
- ✅ Cleanup and re-execution

## 🚀 Quick Start

### Prerequisites

1. **PostgreSQL** running on localhost:5433 (or configure via environment variables)
2. **Node.js** and **pnpm** installed
3. **Database migrations** applied

### Running Tests

```bash
# Run all database tests
pnpm test:db

# Run with coverage
pnpm test:db:coverage

# Run in watch mode
pnpm test:db:watch

# Run specific test file
pnpm test:db --testNamePattern="Schema"
```

### Using the Test Script

```bash
# Setup test database
./scripts/test-database.sh setup

# Run all tests
./scripts/test-database.sh test

# Run with coverage
./scripts/test-database.sh coverage

# Validate schema
./scripts/test-database.sh validate

# Cleanup
./scripts/test-database.sh cleanup
```

## ⚙️ Configuration

### Environment Variables

```bash
# Test database configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5433
TEST_DB_USER=postgres
TEST_DB_PASSWORD=password
TEST_DB_NAME=wellflow_test

# Override for custom setup
export TEST_DB_NAME=my_custom_test_db
```

### Docker Setup

```bash
# Start PostgreSQL for testing
docker run -d \
  --name wellflow-test-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=wellflow_test \
  -p 5433:5432 \
  postgres:15
```

## 📊 Test Coverage

The test suite maintains **80%+ coverage** across:

- **Database Schema**: 100% table and constraint coverage
- **CRUD Operations**: All models tested
- **Business Logic**: Industry-specific rules validated
- **Relationships**: All foreign keys and joins tested
- **Error Handling**: Constraint violations and edge cases

### Coverage Reports

```bash
# Generate coverage report
pnpm test:db:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 🏗️ Database Models Tested

### Core Models (12 Tables)

1. **organizations** - Multi-tenant root entity
2. **users** - RBAC system (owner/manager/pumper)
3. **leases** - Legal agreements with geospatial data
4. **wells** - Individual wellbores with API numbers
5. **production_records** - Daily production data
6. **partners** - Joint venture partners
7. **lease_partners** - Partnership relationships
8. **compliance_reports** - Regulatory reporting
9. **jib_statements** - Joint Interest Billing
10. **documents** - File management
11. **equipment** - Well equipment tracking
12. **well_tests** - Production testing data

### Industry-Specific Validations

- **API Numbers**: 14-digit format (XX-XXX-XXXXX-XX)
- **Production Volumes**: Non-negative decimal values
- **Partnership Percentages**: Sum validation for working interest
- **Well Status**: Valid transitions (drilling → active → plugged)
- **User Roles**: RBAC enforcement (owner/manager/pumper)
- **Multi-tenant**: Organization-based data isolation

## 🔧 Development

### Adding New Tests

1. **Create test file** in `__tests__/` directory
2. **Follow naming convention**: `database-[feature].test.ts`
3. **Use test utilities** from `setup.ts`
4. **Include cleanup** in `beforeEach`/`afterEach`
5. **Test both success and error cases**

### Test Structure

```typescript
describe('Feature Tests', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Setup database connection
  });

  afterAll(async () => {
    // Cleanup connection
  });

  beforeEach(async () => {
    // Clean test data
  });

  describe('Specific Feature', () => {
    test('should validate expected behavior', async () => {
      // Test implementation
    });
  });
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check PostgreSQL is running
   pg_isready -h localhost -p 5433

   # Start with Docker
   docker-compose up -d postgres
   ```

2. **Migration Errors**

   ```bash
   # Reset test database
   ./scripts/test-database.sh cleanup
   ./scripts/test-database.sh setup
   ```

3. **Test Timeouts**

   ```bash
   # Increase timeout in jest.config.database.js
   testTimeout: 60000
   ```

4. **Foreign Key Violations**
   ```bash
   # Check cleanup order in beforeEach
   # Delete child records before parent records
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* pnpm test:db

# Run specific test with verbose output
pnpm test:db --testNamePattern="Schema" --verbose
```

## 📈 Performance Testing

### Query Performance

Tests validate that queries meet performance requirements:

- **Simple queries**: < 10ms
- **Join queries**: < 50ms
- **Complex aggregations**: < 100ms
- **Production data queries**: < 200ms (with proper indexing)

### Load Testing

```bash
# Test with large datasets
TEST_SEED_SIZE=10000 pnpm test:db
```

## 🔒 Security Testing

The test suite validates:

- **SQL Injection**: Parameterized queries
- **Data Isolation**: Multi-tenant security
- **Access Control**: Role-based permissions
- **Audit Trails**: Change tracking

## 📚 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Jest Testing Framework](https://jestjs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Oil & Gas API Standards](https://www.api.org/)

## 🤝 Contributing

1. **Write tests first** (TDD approach)
2. **Maintain 80%+ coverage**
3. **Follow naming conventions**
4. **Include documentation**
5. **Test both success and failure cases**

---

**WellFlow Database Testing Suite** - Ensuring reliable, scalable, and industry-compliant database operations for oil & gas production management. 🛢️⚡
