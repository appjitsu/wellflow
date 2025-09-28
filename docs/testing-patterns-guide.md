# WellFlow API Testing Patterns Guide

## Overview

This guide outlines the testing patterns and best practices for testing API
classes in the WellFlow platform, covering unit tests, integration tests, and
end-to-end tests.

## Testing Philosophy

### Three-Layer Testing Strategy

```
┌─────────────────────────────────────────┐
│         E2E Tests (10%)                 │  ← Real Database, Full Stack
├─────────────────────────────────────────┤
│     Integration Tests (30%)             │  ← Test Database, Real Dependencies
├─────────────────────────────────────────┤
│        Unit Tests (60%)                 │  ← Mocked Dependencies, Fast
└─────────────────────────────────────────┘
```

## 1. Unit Tests (Controllers & Services)

### Pattern: Mock Everything External

**When to Use**: Testing business logic, controllers, and services in isolation

```typescript
// wells.controller.spec.ts
describe('WellsController', () => {
  let controller: WellsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  // Mock all external dependencies
  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WellsController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WellsController>(WellsController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWell', () => {
    it('should create a well successfully', async () => {
      const createWellDto: CreateWellDto = {
        name: 'Test Well #1',
        apiNumber: '4212312345',
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: {
          latitude: 32.7767,
          longitude: -96.797,
        },
      };

      const expectedWellId = 'well-123';
      mockCommandBus.execute.mockResolvedValue(expectedWellId);

      const result = await controller.createWell(createWellDto, mockRequest);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateWellCommand)
      );
      expect(result).toEqual({
        id: expectedWellId,
        message: 'Well created successfully',
      });
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        apiNumber: 'invalid-api', // Invalid: wrong format
      } as CreateWellDto;

      mockCommandBus.execute.mockRejectedValue(new Error('Validation failed'));

      await expect(
        controller.createWell(invalidDto, mockRequest)
      ).rejects.toThrow('Validation failed');
    });
  });
});
```

### Service Testing Pattern

```typescript
// wells.service.spec.ts
describe('WellsService', () => {
  let service: WellsService;
  let repository: jest.Mocked<WellRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    // Create mock implementations
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    eventBus = {
      publish: jest.fn(),
    } as any;

    service = new WellsService(repository, eventBus);
  });

  describe('createWell', () => {
    it('should create and save a well', async () => {
      const wellData = createValidWellData();
      const savedWell = Well.create(wellData);

      repository.save.mockResolvedValue(savedWell);

      const result = await service.createWell(wellData);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: wellData.name,
          apiNumber: wellData.apiNumber,
        })
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(WellCreatedEvent)
      );
      expect(result).toEqual(savedWell);
    });

    it('should handle repository errors', async () => {
      repository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createWell(createValidWellData())).rejects.toThrow(
        'Database error'
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
```

## 2. Integration Tests (Repository & Database)

### Pattern: NestJS Testing Module with Real Database

**When to Use**: Testing repository implementations, database queries, and data
persistence with real dependencies

**Key Benefits**:

- Uses actual database schema and constraints
- Tests real Drizzle ORM queries
- Validates foreign key relationships
- Ensures data integrity and business rules

```typescript
// lease.repository.integration.spec.ts
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { RepositoryModule } from '../repository.module';
import { LeaseRepository } from '../lease.repository';
import { Test, TestingModule } from '@nestjs/testing';

describe('LeaseRepository Integration', () => {
  let repository: LeaseRepository;
  let databaseService: DatabaseService;
  let db: any;

  // Test data constants
  const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    // Create test module with real database service
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule,
      ],
      providers: [
        {
          provide: 'LeaseRepository',
          useFactory: (databaseService: DatabaseService) => {
            return new LeaseRepository(databaseService);
          },
          inject: [DatabaseService],
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<LeaseRepository>('LeaseRepository');

    // Initialize the database
    await databaseService.onModuleInit();
    db = databaseService.getDb();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await db
        .delete(require('../../../database/schema').leases)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').leases.organizationId,
            TEST_ORG_ID
          )
        );
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up any remaining test data
    try {
      await db
        .delete(require('../../../database/schema').leases)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').leases.organizationId,
            TEST_ORG_ID
          )
        );
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create a new lease', async () => {
      // Given - Create lease data
      const leaseData = {
        name: 'Test Lease #1',
        leaseNumber: 'TL-001',
        lessor: 'Test Lessor LLC',
        lessee: 'Test Lessee Corp',
        acreage: '640.5',
        royaltyRate: '0.1875',
        effectiveDate: '2024-01-01',
        expirationDate: '2029-01-01',
        legalDescription: 'Section 12, Township 1N, Range 2W',
        organizationId: TEST_ORG_ID,
      };

      // When - Create the lease
      const result = await repository.create(leaseData);

      // Then - Verify lease was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Lease #1');
      expect(result.leaseNumber).toBe('TL-001');
      expect(result.organizationId).toBe(TEST_ORG_ID);
      expect(result.status).toBe('active');
    });
  });

  describe('findById', () => {
    it('should find lease by ID', async () => {
      // Given - Create and save a lease
      const leaseData = {
        name: 'Test Lease #2',
        leaseNumber: 'TL-002',
        lessor: 'Test Lessor LLC',
        lessee: 'Test Lessee Corp',
        organizationId: TEST_ORG_ID,
      };

      const created = await repository.create(leaseData);

      // When - Find by ID
      const found = await repository.findById(created.id);

      // Then - Verify lease found
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Lease #2');
    });

    it('should return null for non-existent lease', async () => {
      const found = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(found).toBeNull();
    });
  });

    it('should update existing well', async () => {
      // Given - Create initial well
      const well = await createAndSaveWell(repository, transaction);

      // When - Update the well
      well.updateStatus(WellStatus.COMPLETED);
      const updatedWell = await repository.save(well, transaction);

      // Then - Verify update
      const result = await repository.findById(well.getId(), transaction);
      expect(result?.getStatus()).toBe(WellStatus.COMPLETED);
      expect(result?.getUpdatedAt()).not.toEqual(well.getCreatedAt());
    });

    it('should handle unique constraint violations', async () => {
      // Given - Create well with API number
      const apiNumber = '42-123-12345';
      await createAndSaveWell(repository, transaction, { apiNumber });

      // When - Try to create another well with same API number
      const duplicateWell = Well.create({
        name: 'Duplicate Well',
        apiNumber, // Same API number
        operatorId: 'op-456',
      });

      // Then - Should throw unique constraint error
      await expect(repository.save(duplicateWell, transaction)).rejects.toThrow(
        'Unique constraint violation'
      );
    });
  });

  describe('findById', () => {
    it('should retrieve well with all relationships', async () => {
      // Given
      const well = await createAndSaveWell(repository, transaction);
      const production = await createAndSaveProduction(
        well.getId(),
        transaction
      );

      // When
      const result = await repository.findByIdWithRelations(
        well.getId(),
        transaction
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.getProduction()).toHaveLength(1);
      expect(result?.getProduction()[0].getId()).toEqual(production.getId());
    });

    it('should return null for non-existent well', async () => {
      const result = await repository.findById(
        new WellId('non-existent'),
        transaction
      );

      expect(result).toBeNull();
    });
  });

  describe('complex queries', () => {
    it('should find wells by operator with pagination', async () => {
      // Given - Create multiple wells
      const operatorId = 'op-123';
      for (let i = 0; i < 15; i++) {
        await createAndSaveWell(repository, transaction, {
          name: `Well #${i}`,
          operatorId,
        });
      }

      // When - Query with pagination
      const page1 = await repository.findByOperator(
        operatorId,
        { page: 1, limit: 10 },
        transaction
      );
      const page2 = await repository.findByOperator(
        operatorId,
        { page: 2, limit: 10 },
        transaction
      );

      // Then
      expect(page1.wells).toHaveLength(10);
      expect(page2.wells).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page2.total).toBe(15);
    });

    it('should handle complex filtering', async () => {
      // Given - Wells with different statuses and dates
      await createAndSaveWell(repository, transaction, {
        status: WellStatus.PRODUCING,
        spudDate: new Date('2024-01-01'),
      });
      await createAndSaveWell(repository, transaction, {
        status: WellStatus.DRILLING,
        spudDate: new Date('2024-06-01'),
      });
      await createAndSaveWell(repository, transaction, {
        status: WellStatus.PRODUCING,
        spudDate: new Date('2024-09-01'),
      });

      // When
      const filters = {
        status: WellStatus.PRODUCING,
        spudDateFrom: new Date('2024-07-01'),
      };
      const result = await repository.findByFilters(filters, transaction);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].getStatus()).toBe(WellStatus.PRODUCING);
      expect(result[0].getSpudDate()).toBeAfter(new Date('2024-07-01'));
    });
  });
});
```

## 3. End-to-End Tests (Full API)

### Pattern: Real Server, Test Database

**When to Use**: Testing complete API workflows, authentication, and multi-step
operations

```typescript
// wells.e2e.spec.ts
describe('Wells API E2E', () => {
  let app: INestApplication;
  let testDb: Database;
  let authToken: string;
  let organizationId: string;

  beforeAll(async () => {
    // Setup test database
    testDb = await createTestDatabase();
    await runMigrations(testDb);

    // Create test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useValue(testDb)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global middleware and pipes
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    // Setup test organization and user
    const setupResult = await setupTestOrganization(app);
    organizationId = setupResult.organizationId;
    authToken = setupResult.authToken;
  });

  afterEach(async () => {
    // Clean up test data but keep organization
    await cleanTestData(testDb, organizationId);
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  describe('POST /wells', () => {
    it('should create well with valid authentication', async () => {
      const wellData = {
        name: 'Test Well #1',
        apiNumber: '42-123-12345',
        wellType: 'OIL',
        location: {
          latitude: 32.7767,
          longitude: -96.797,
          county: 'Midland',
          state: 'TX',
        },
        spudDate: '2024-01-15',
        totalDepth: 8500,
      };

      const response = await request(app.getHttpServer())
        .post('/wells')
        .set('Authorization', `Bearer ${authToken}`)
        .send(wellData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Test Well #1',
        apiNumber: '42-123-12345',
        organizationId,
      });

      // Verify in database
      const wellInDb = await testDb.query('SELECT * FROM wells WHERE id = $1', [
        response.body.id,
      ]);
      expect(wellInDb.rows).toHaveLength(1);
    });

    it('should reject invalid API number format', async () => {
      const invalidWellData = {
        name: 'Test Well',
        apiNumber: 'invalid-format', // Invalid
        wellType: 'OIL',
        location: {
          latitude: 32.7767,
          longitude: -96.797,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/wells')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWellData)
        .expect(400);

      expect(response.body.message).toContain('Invalid API number format');
    });

    it('should enforce authorization', async () => {
      const wellData = {
        name: 'Unauthorized Well',
        apiNumber: '42-123-99999',
      };

      await request(app.getHttpServer())
        .post('/wells')
        .send(wellData)
        .expect(401); // No auth token
    });
  });

  describe('Complete workflow test', () => {
    it('should handle well creation to production reporting workflow', async () => {
      // Step 1: Create well
      const createResponse = await request(app.getHttpServer())
        .post('/wells')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Workflow Test Well',
          apiNumber: '42-123-88888',
          wellType: 'OIL',
          location: {
            latitude: 32.7767,
            longitude: -96.797,
          },
        })
        .expect(201);

      const wellId = createResponse.body.id;

      // Step 2: Add production data
      const productionResponse = await request(app.getHttpServer())
        .post(`/wells/${wellId}/production`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-09-01',
          oilVolume: 150.5,
          gasVolume: 450.2,
          waterVolume: 25.3,
        })
        .expect(201);

      // Step 3: Get well with production
      const getResponse = await request(app.getHttpServer())
        .get(`/wells/${wellId}?include=production`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: wellId,
        name: 'Workflow Test Well',
        production: expect.arrayContaining([
          expect.objectContaining({
            oilVolume: 150.5,
            gasVolume: 450.2,
          }),
        ]),
      });

      // Step 4: Generate Form PR (compliance report)
      const reportResponse = await request(app.getHttpServer())
        .post('/reports/form-pr')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          wellIds: [wellId],
          reportingMonth: '2024-09',
        })
        .expect(201);

      expect(reportResponse.body).toMatchObject({
        reportType: 'FORM_PR',
        status: 'DRAFT',
        wellCount: 1,
      });
    });
  });
});
```

## 4. Database Testing Patterns

### Should You Create Rows in the Database?

**Answer: It depends on the test type:**

### ✅ **YES - For Integration & E2E Tests**

```typescript
// Integration tests SHOULD use real database
describe('WellRepository Integration', () => {
  it('should handle complex queries with real data', async () => {
    // Create actual database rows
    await testDb.query(
      `INSERT INTO wells (id, name, api_number, operator_id) 
       VALUES ($1, $2, $3, $4)`,
      ['well-123', 'Test Well', '42-123-12345', 'op-123']
    );

    // Test actual database behavior
    const result = await repository.findByApiNumber('42-123-12345');
    expect(result).toBeDefined();
  });
});
```

### ❌ **NO - For Unit Tests**

```typescript
// Unit tests should NOT touch the database
describe('WellService', () => {
  it('should process well data', async () => {
    // Mock the repository - no database
    const mockRepository = {
      save: jest.fn().mockResolvedValue(mockWell),
    };

    const service = new WellService(mockRepository);
    const result = await service.createWell(data);

    expect(mockRepository.save).toHaveBeenCalled();
    // No actual database rows created
  });
});
```

## 5. Test Data Management

### Factory Pattern for Test Data

```typescript
// test/factories/well.factory.ts
export class WellFactory {
  static create(overrides?: Partial<WellData>): Well {
    const defaults: WellData = {
      id: generateTestId('well'),
      name: `Test Well ${faker.number.int()}`,
      apiNumber: generateValidApiNumber(),
      operatorId: generateTestId('operator'),
      wellType: WellType.OIL,
      status: WellStatus.PRODUCING,
      location: {
        latitude: 32.7767,
        longitude: -96.797,
        county: 'Midland',
        state: 'TX',
      },
      spudDate: faker.date.past(),
      totalDepth: faker.number.int({ min: 5000, max: 15000 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Well.create({ ...defaults, ...overrides });
  }

  static createMany(count: number, overrides?: Partial<WellData>): Well[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static async saveToDb(
    db: Database,
    overrides?: Partial<WellData>
  ): Promise<Well> {
    const well = this.create(overrides);
    await db.query(
      `INSERT INTO wells (id, name, api_number, operator_id, well_type, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        well.getId().getValue(),
        well.getName(),
        well.getApiNumber(),
        well.getOperatorId(),
        well.getWellType(),
        well.getStatus(),
      ]
    );
    return well;
  }
}
```

### Database Cleanup Strategies

```typescript
// test/helpers/database.helper.ts
export class DatabaseTestHelper {
  private transaction: DatabaseTransaction | null = null;

  // Strategy 1: Transaction Rollback (Fastest)
  async setupTransaction(db: Database): Promise<void> {
    this.transaction = await db.transaction();
  }

  async cleanupTransaction(): Promise<void> {
    if (this.transaction) {
      await this.transaction.rollback();
      this.transaction = null;
    }
  }

  // Strategy 2: Truncate Tables (Complete)
  async truncateTables(db: Database, tables: string[]): Promise<void> {
    await db.query(
      `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`
    );
  }

  // Strategy 3: Delete Specific Test Data
  async deleteTestData(db: Database, organizationId: string): Promise<void> {
    // Delete in reverse order of foreign key dependencies
    await db.query(
      'DELETE FROM production WHERE well_id IN (SELECT id FROM wells WHERE organization_id = $1)',
      [organizationId]
    );
    await db.query('DELETE FROM wells WHERE organization_id = $1', [
      organizationId,
    ]);
    await db.query('DELETE FROM leases WHERE organization_id = $1', [
      organizationId,
    ]);
    // ... more deletions
  }
}
```

## 6. Performance Considerations

### Test Database Optimization

```typescript
// jest.global-setup.js
module.exports = async () => {
  // Create test database with optimizations
  const client = new Client({
    host: process.env.DB_HOST,
    database: 'postgres',
  });

  await client.connect();

  // Create test database with performance settings
  await client.query(`
    CREATE DATABASE wellflow_test
    WITH 
    TEMPLATE = template0
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
  `);

  // Configure for testing performance
  const testClient = new Client({
    database: 'wellflow_test',
  });

  await testClient.connect();
  await testClient.query(`
    ALTER DATABASE wellflow_test SET synchronous_commit = off;
    ALTER DATABASE wellflow_test SET shared_buffers = '256MB';
    ALTER DATABASE wellflow_test SET fsync = off;
    ALTER DATABASE wellflow_test SET full_page_writes = off;
  `);

  await testClient.end();
  await client.end();
};
```

### Parallel Test Execution

```typescript
// jest.config.js
module.exports = {
  // Run integration tests serially
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/*.spec.ts'],
      maxWorkers: '50%', // Parallel
    },
    {
      displayName: 'integration',
      testMatch: ['**/*.integration.ts'],
      maxWorkers: 1, // Serial - avoid database conflicts
    },
    {
      displayName: 'e2e',
      testMatch: ['**/*.e2e.ts'],
      maxWorkers: 1, // Serial
    },
  ],
};
```

## 7. Best Practices Summary

### DO's ✅

1. **Use appropriate test type for the scenario**
   - Unit tests for business logic (mock database)
   - Integration tests for data persistence (test database)
   - E2E tests for complete workflows (full stack)

2. **Keep tests isolated**
   - Use transactions for integration tests
   - Clean up after each test
   - Don't depend on test execution order

3. **Use factories for test data**
   - Consistent test data generation
   - Easy to maintain
   - Reduces duplication

4. **Test both success and failure paths**
   - Happy path scenarios
   - Validation errors
   - Database constraints
   - Authorization failures

### DON'Ts ❌

1. **Don't use production database for testing**
   - Always use separate test database
   - Never test against live data

2. **Don't create database rows in unit tests**
   - Unit tests should be fast and isolated
   - Mock all external dependencies

3. **Don't skip cleanup**
   - Always clean up test data
   - Prevents test pollution
   - Ensures consistent results

4. **Don't test framework code**
   - Focus on your business logic
   - Trust that NestJS/TypeORM work

## 8. Oil & Gas Specific Test Scenarios

```typescript
// Oil & gas domain-specific tests
describe('Production Allocation', () => {
  it('should allocate production by working interest', async () => {
    // Given - Well with multiple working interest owners
    const well = await WellFactory.saveToDb(db);
    const partners = [
      { partnerId: 'p1', workingInterest: 0.25 },
      { partnerId: 'p2', workingInterest: 0.25 },
      { partnerId: 'p3', workingInterest: 0.5 },
    ];

    // When - Production is recorded
    const production = {
      wellId: well.id,
      oilVolume: 100, // barrels
      gasVolume: 500, // mcf
      date: '2024-09-01',
    };

    const allocations = await allocationService.allocateProduction(
      production,
      partners
    );

    // Then - Production is allocated correctly
    expect(allocations).toEqual([
      { partnerId: 'p1', oilShare: 25, gasShare: 125 },
      { partnerId: 'p2', oilShare: 25, gasShare: 125 },
      { partnerId: 'p3', oilShare: 50, gasShare: 250 },
    ]);
  });

  it('should handle regulatory compliance reporting', async () => {
    // Given - Wells with production data
    const wells = await WellFactory.createMany(5, {
      organizationId,
      status: WellStatus.PRODUCING,
    });

    // When - Generate Form PR for Texas RRC
    const formPr = await complianceService.generateFormPR({
      wellIds: wells.map((w) => w.id),
      reportingMonth: '2024-09',
      state: 'TX',
    });

    // Then - Form PR contains required data
    expect(formPr).toMatchObject({
      operatorNumber: expect.any(String),
      reportingPeriod: '2024-09',
      totalOilProduction: expect.any(Number),
      totalGasProduction: expect.any(Number),
      severanceTaxDue: expect.any(Number),
      wellCount: 5,
    });
  });
});
```

### Database Setup for Integration Tests

Integration tests require a properly configured test database. Use
`jest.global-setup.js` to:

1. **Create Test Database Schema**: Include all required tables with constraints
2. **Insert Test Data**: Add organizations, wells, and other required entities
3. **Handle Foreign Keys**: Ensure referenced entities exist before tests run

```javascript
// jest.global-setup.js - Database Setup
const createTablesSQL = `
  -- Create organizations table
  CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  );

  -- Create leases table with foreign key constraints
  CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    lease_number VARCHAR(100),
    lessor VARCHAR(255) NOT NULL,
    lessee VARCHAR(255) NOT NULL,
    acreage DECIMAL(10,4),
    royalty_rate DECIMAL(5,4),
    effective_date DATE,
    expiration_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    legal_description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT leases_royalty_rate_range_check CHECK (royalty_rate IS NULL OR (royalty_rate >= 0 AND royalty_rate <= 1)),
    CONSTRAINT leases_acreage_positive_check CHECK (acreage IS NULL OR acreage > 0),
    CONSTRAINT leases_date_range_check CHECK (expiration_date IS NULL OR effective_date IS NULL OR effective_date <= expiration_date)
  );

  -- Insert test organization
  INSERT INTO organizations (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Organization');
`;

// Insert test data
await testClient.query(`
  INSERT INTO organizations (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Test Organization');
`);
```

### Test Data Management

**Pattern**: Clean test data between tests using direct database queries

```typescript
beforeEach(async () => {
  // Clean up test data before each test
  await db
    .delete(require('../../../database/schema').leases)
    .where(
      eq(require('../../../database/schema').leases.organizationId, TEST_ORG_ID)
    );
});
```

**Benefits**:

- Tests are completely isolated
- No test data leakage between test cases
- Consistent test environment
- Fast test execution (no complex teardown)

## Conclusion

The key to effective API testing in WellFlow is using the right testing approach
for each scenario:

- **Unit tests** (60%): Fast, isolated, mock everything
- **Integration tests** (30%): Test database, verify data persistence
- **E2E tests** (10%): Complete workflows, real API calls

Creating database rows is perfectly acceptable and necessary for integration and
E2E tests, but should be avoided in unit tests to maintain speed and isolation.

---

_Remember: Good tests are the foundation of reliable oil & gas production
monitoring software. Test thoroughly, but test smart._
