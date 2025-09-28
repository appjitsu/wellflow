# Testing Backend Patterns - WellFlow Complete Guide

## Overview

This guide provides comprehensive testing strategies for each architectural
pattern implemented in WellFlow's backend, with specific examples from the oil &
gas domain.

## Table of Contents

1. [Domain-Driven Design (DDD) Testing](#1-domain-driven-design-ddd-testing)
2. [CQRS Pattern Testing](#2-cqrs-pattern-testing)
3. [Repository Pattern Testing](#3-repository-pattern-testing)
4. [Unit of Work Pattern Testing](#4-unit-of-work-pattern-testing)
5. [Hexagonal Architecture Testing](#5-hexagonal-architecture-testing)
6. [Factory Pattern Testing](#6-factory-pattern-testing)
7. [Strategy Pattern Testing](#7-strategy-pattern-testing)
8. [Specification Pattern Testing](#8-specification-pattern-testing)
9. [Observer Pattern Testing](#9-observer-pattern-testing)
10. [Circuit Breaker Pattern Testing](#10-circuit-breaker-pattern-testing)
11. [Anti-Corruption Layer Testing](#11-anti-corruption-layer-testing)
12. [Retry Pattern Testing](#12-retry-pattern-testing)
13. [DTO Pattern Testing](#13-dto-pattern-testing)
14. [RBAC-CASL Testing](#14-rbac-casl-testing)
15. [SOLID Principles Testing](#15-solid-principles-testing)

---

## 1. Domain-Driven Design (DDD) Testing

### Testing Entities

```typescript
// well.entity.spec.ts
describe('Well Entity', () => {
  describe('creation', () => {
    it('should create a valid well entity', () => {
      // Given
      const wellData = {
        name: 'Test Well #1',
        apiNumber: '42-123-12345',
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: {
          latitude: 32.7767,
          longitude: -96.797,
        },
      };

      // When
      const well = Well.create(wellData);

      // Then
      expect(well.getId()).toBeInstanceOf(WellId);
      expect(well.getName()).toBe('Test Well #1');
      expect(well.getApiNumber()).toBe('42-123-12345');
      expect(well.getStatus()).toBe(WellStatus.PERMITTED); // Default status
    });

    it('should enforce business rules on creation', () => {
      // Given - Invalid API number format
      const invalidData = {
        name: 'Test Well',
        apiNumber: 'invalid-format',
        operatorId: 'op-123',
      };

      // When/Then
      expect(() => Well.create(invalidData)).toThrow(InvalidApiNumberError);
    });
  });

  describe('business operations', () => {
    it('should transition status following business rules', () => {
      // Given
      const well = Well.create(validWellData());
      expect(well.getStatus()).toBe(WellStatus.PERMITTED);

      // When - Valid transition
      well.startDrilling();

      // Then
      expect(well.getStatus()).toBe(WellStatus.DRILLING);
      expect(well.getDomainEvents()).toContainEqual(
        expect.objectContaining({
          type: 'WellDrillingStarted',
        })
      );
    });

    it('should prevent invalid status transitions', () => {
      // Given - Well in COMPLETED status
      const well = Well.create(validWellData());
      well.startDrilling();
      well.complete();

      // When/Then - Cannot go back to drilling
      expect(() => well.startDrilling()).toThrow(InvalidStatusTransitionError);
    });
  });

  describe('domain events', () => {
    it('should emit events for significant state changes', () => {
      // Given
      const well = Well.create(validWellData());

      // When
      well.startProduction();

      // Then
      const events = well.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'WellProductionStarted',
        wellId: well.getId().getValue(),
        occurredAt: expect.any(Date),
      });
    });
  });
});
```

### Testing Value Objects

```typescript
// money.value-object.spec.ts
describe('Money Value Object', () => {
  describe('creation', () => {
    it('should create valid money instance', () => {
      const money = Money.create(100.5, 'USD');

      expect(money.getAmount()).toBe(100.5);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should prevent negative amounts for revenue', () => {
      expect(() => Money.createRevenue(-100, 'USD')).toThrow(
        'Revenue cannot be negative'
      );
    });
  });

  describe('operations', () => {
    it('should add money with same currency', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(50, 'USD');

      const result = money1.add(money2);

      expect(result.getAmount()).toBe(150);
    });

    it('should prevent operations with different currencies', () => {
      const usd = Money.create(100, 'USD');
      const eur = Money.create(50, 'EUR');

      expect(() => usd.add(eur)).toThrow('Currency mismatch');
    });
  });

  describe('equality', () => {
    it('should be equal for same amount and currency', () => {
      const money1 = Money.create(100, 'USD');
      const money2 = Money.create(100, 'USD');

      expect(money1.equals(money2)).toBe(true);
    });
  });
});
```

### Testing Domain Services

```typescript
// production-allocation.service.spec.ts
describe('ProductionAllocationService', () => {
  let service: ProductionAllocationService;

  beforeEach(() => {
    service = new ProductionAllocationService();
  });

  it('should allocate production by working interest', () => {
    // Given
    const production = Production.create({
      wellId: 'well-123',
      date: new Date('2024-09-01'),
      oilVolume: 100,
      gasVolume: 500,
    });

    const workingInterests = [
      WorkingInterest.create('partner-1', 0.25),
      WorkingInterest.create('partner-2', 0.25),
      WorkingInterest.create('partner-3', 0.5),
    ];

    // When
    const allocations = service.allocate(production, workingInterests);

    // Then
    expect(allocations).toHaveLength(3);
    expect(allocations[0]).toMatchObject({
      partnerId: 'partner-1',
      oilShare: 25,
      gasShare: 125,
    });
    expect(allocations[2]).toMatchObject({
      partnerId: 'partner-3',
      oilShare: 50,
      gasShare: 250,
    });
  });

  it('should handle royalty deductions', () => {
    // Given
    const production = Production.create({
      wellId: 'well-123',
      oilVolume: 100,
    });

    const royaltyRate = 0.125; // 1/8 royalty

    // When
    const netProduction = service.deductRoyalty(production, royaltyRate);

    // Then
    expect(netProduction.getOilVolume()).toBe(87.5);
  });
});
```

---

## 2. CQRS Pattern Testing

### Testing Commands and Command Handlers

```typescript
// create-well.command.spec.ts
describe('CreateWellCommand', () => {
  let handler: CreateWellCommandHandler;
  let repository: jest.Mocked<WellRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findByApiNumber: jest.fn(),
    } as any;

    eventBus = {
      publish: jest.fn(),
    } as any;

    handler = new CreateWellCommandHandler(repository, eventBus);
  });

  it('should create well when API number is unique', async () => {
    // Given
    const command = new CreateWellCommand({
      name: 'Test Well #1',
      apiNumber: '42-123-12345',
      operatorId: 'op-123',
      wellType: WellType.OIL,
      location: { latitude: 32.7767, longitude: -96.797 },
    });

    repository.findByApiNumber.mockResolvedValue(null); // No existing well
    repository.save.mockImplementation((well) => Promise.resolve(well));

    // When
    const result = await handler.execute(command);

    // Then
    expect(repository.findByApiNumber).toHaveBeenCalledWith('42-123-12345');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Well #1',
        apiNumber: '42-123-12345',
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(WellCreatedEvent));
    expect(result).toMatch(/^well-/); // Returns well ID
  });

  it('should reject duplicate API numbers', async () => {
    // Given
    const command = new CreateWellCommand({
      apiNumber: '42-123-12345',
      // ... other fields
    });

    const existingWell = Well.create({
      apiNumber: '42-123-12345',
      // ... other fields
    });

    repository.findByApiNumber.mockResolvedValue(existingWell);

    // When/Then
    await expect(handler.execute(command)).rejects.toThrow(
      'API number already exists'
    );
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
```

### Testing Queries and Query Handlers

```typescript
// get-production-summary.query.spec.ts
describe('GetProductionSummaryQuery', () => {
  let handler: GetProductionSummaryQueryHandler;
  let readModel: jest.Mocked<ProductionReadModel>;

  beforeEach(() => {
    readModel = {
      getProductionSummary: jest.fn(),
      getMonthlyTotals: jest.fn(),
    } as any;

    handler = new GetProductionSummaryQueryHandler(readModel);
  });

  it('should return production summary for date range', async () => {
    // Given
    const query = new GetProductionSummaryQuery({
      organizationId: 'org-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-09-30'),
    });

    const mockSummary = {
      totalOilProduction: 15000,
      totalGasProduction: 45000,
      totalWaterDisposal: 3000,
      activeWells: 25,
      averageDailyProduction: {
        oil: 55.5,
        gas: 166.7,
      },
    };

    readModel.getProductionSummary.mockResolvedValue(mockSummary);

    // When
    const result = await handler.execute(query);

    // Then
    expect(readModel.getProductionSummary).toHaveBeenCalledWith(
      'org-123',
      query.startDate,
      query.endDate
    );
    expect(result).toEqual(mockSummary);
  });

  it('should handle empty production periods', async () => {
    // Given
    const query = new GetProductionSummaryQuery({
      organizationId: 'org-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    readModel.getProductionSummary.mockResolvedValue(null);

    // When
    const result = await handler.execute(query);

    // Then
    expect(result).toEqual({
      totalOilProduction: 0,
      totalGasProduction: 0,
      totalWaterDisposal: 0,
      activeWells: 0,
      averageDailyProduction: { oil: 0, gas: 0 },
    });
  });
});
```

### Testing Sagas (Long-Running Processes)

```typescript
// well-completion.saga.spec.ts
describe('WellCompletionSaga', () => {
  let saga: WellCompletionSaga;
  let commandBus: jest.Mocked<CommandBus>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as any;
    eventBus = { publish: jest.fn() } as any;
    saga = new WellCompletionSaga(commandBus, eventBus);
  });

  it('should orchestrate well completion process', async () => {
    // Given
    const event = new WellDrillingCompletedEvent({
      wellId: 'well-123',
      completionDate: new Date('2024-09-01'),
      totalDepth: 10000,
    });

    // When
    await saga.handle(event);

    // Then - Should trigger multiple commands in sequence
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(ScheduleCompletionWorkCommand)
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(NotifyRegulatoryAgencyCommand)
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateWellStatusCommand)
    );
  });
});
```

---

## 3. Repository Pattern Testing

### Testing Repository Implementation

```typescript
// well.repository.spec.ts
describe('WellRepository', () => {
  let repository: WellRepository;
  let db: jest.Mocked<Database>;

  beforeEach(() => {
    db = {
      query: jest.fn(),
      transaction: jest.fn(),
    } as any;

    repository = new WellRepository(db);
  });

  describe('save', () => {
    it('should insert new well', async () => {
      // Given
      const well = Well.create({
        name: 'Test Well',
        apiNumber: '42-123-12345',
        operatorId: 'op-123',
      });

      db.query.mockResolvedValue({ rows: [{ id: well.getId().getValue() }] });

      // When
      await repository.save(well);

      // Then
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO wells'),
        expect.arrayContaining([
          well.getId().getValue(),
          'Test Well',
          '42-123-12345',
        ])
      );
    });

    it('should update existing well', async () => {
      // Given
      const well = Well.create({
        id: 'existing-well-123',
        name: 'Updated Well',
        apiNumber: '42-123-12345',
      });
      well.markAsExisting(); // Domain method to indicate it's not new

      db.query.mockResolvedValue({ rows: [{ id: well.getId().getValue() }] });

      // When
      await repository.save(well);

      // Then
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wells SET'),
        expect.arrayContaining(['Updated Well', 'existing-well-123'])
      );
    });
  });

  describe('findById', () => {
    it('should return well when found', async () => {
      // Given
      const wellData = {
        id: 'well-123',
        name: 'Test Well',
        api_number: '42-123-12345',
        operator_id: 'op-123',
        well_type: 'OIL',
        status: 'PRODUCING',
        created_at: new Date(),
        updated_at: new Date(),
      };

      db.query.mockResolvedValue({ rows: [wellData], rowCount: 1 });

      // When
      const result = await repository.findById(new WellId('well-123'));

      // Then
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM wells WHERE id = $1'),
        ['well-123']
      );
      expect(result).toBeInstanceOf(Well);
      expect(result?.getName()).toBe('Test Well');
    });

    it('should return null when not found', async () => {
      // Given
      db.query.mockResolvedValue({ rows: [], rowCount: 0 });

      // When
      const result = await repository.findById(new WellId('non-existent'));

      // Then
      expect(result).toBeNull();
    });
  });

  describe('complex queries', () => {
    it('should find wells by multiple criteria', async () => {
      // Given
      const criteria = {
        operatorId: 'op-123',
        status: WellStatus.PRODUCING,
        spudDateFrom: new Date('2024-01-01'),
        spudDateTo: new Date('2024-12-31'),
      };

      db.query.mockResolvedValue({
        rows: [
          { id: 'well-1', name: 'Well 1' },
          { id: 'well-2', name: 'Well 2' },
        ],
      });

      // When
      const result = await repository.findByCriteria(criteria);

      // Then
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE operator_id = $1 AND status = $2'),
        expect.arrayContaining(['op-123', 'PRODUCING'])
      );
      expect(result).toHaveLength(2);
    });
  });
});
```

### Testing Repository with Integration Tests

```typescript
// well.repository.integration.spec.ts
describe('WellRepository Integration', () => {
  let repository: WellRepository;
  let testDb: TestDatabase;
  let transaction: DatabaseTransaction;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repository = new WellRepository(testDb);
  });

  beforeEach(async () => {
    transaction = await testDb.transaction();
  });

  afterEach(async () => {
    await transaction.rollback();
  });

  it('should handle concurrent updates with optimistic locking', async () => {
    // Given - Create well
    const well = Well.create({ name: 'Test Well', apiNumber: '42-123-12345' });
    await repository.save(well, transaction);

    // When - Two concurrent updates
    const repo1 = new WellRepository(transaction);
    const repo2 = new WellRepository(transaction);

    const well1 = await repo1.findById(well.getId(), transaction);
    const well2 = await repo2.findById(well.getId(), transaction);

    well1!.updateName('Update 1');
    well2!.updateName('Update 2');

    await repo1.save(well1!, transaction);

    // Then - Second update should fail
    await expect(repo2.save(well2!, transaction)).rejects.toThrow(
      OptimisticLockException
    );
  });
});
```

---

## 4. Unit of Work Pattern Testing

```typescript
// unit-of-work.spec.ts
describe('UnitOfWork', () => {
  let uow: UnitOfWork;
  let mockDb: jest.Mocked<Database>;
  let mockTransaction: jest.Mocked<DatabaseTransaction>;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
      query: jest.fn(),
    } as any;

    mockDb = {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    } as any;

    uow = new UnitOfWork(mockDb);
  });

  describe('change tracking', () => {
    it('should track new entities', () => {
      // Given
      const well = Well.create({ name: 'New Well' });

      // When
      uow.registerNew(well);

      // Then
      expect(uow.getNewEntities()).toContain(well);
      expect(uow.getDirtyEntities()).not.toContain(well);
    });

    it('should track modified entities', () => {
      // Given
      const well = Well.create({ name: 'Existing Well' });
      well.markAsExisting();

      // When
      well.updateName('Modified Well');
      uow.registerDirty(well);

      // Then
      expect(uow.getDirtyEntities()).toContain(well);
      expect(uow.getNewEntities()).not.toContain(well);
    });

    it('should handle entity state transitions', () => {
      // Given
      const well = Well.create({ name: 'Test Well' });

      // When - Register as new, then delete
      uow.registerNew(well);
      uow.registerDeleted(well);

      // Then - Should not be in any collection (new entity deleted = no action)
      expect(uow.getNewEntities()).not.toContain(well);
      expect(uow.getDeletedEntities()).not.toContain(well);
    });
  });

  describe('commit', () => {
    it('should save all changes in correct order', async () => {
      // Given
      const newWell = Well.create({ name: 'New Well' });
      const modifiedWell = Well.create({ name: 'Modified Well' });
      const deletedWell = Well.create({ name: 'Deleted Well' });

      uow.registerNew(newWell);
      uow.registerDirty(modifiedWell);
      uow.registerDeleted(deletedWell);

      const saveOrder: string[] = [];
      mockTransaction.query.mockImplementation((sql) => {
        if (sql.includes('INSERT')) saveOrder.push('insert');
        if (sql.includes('UPDATE')) saveOrder.push('update');
        if (sql.includes('DELETE')) saveOrder.push('delete');
        return Promise.resolve({ rows: [] });
      });

      // When
      await uow.commit();

      // Then
      expect(saveOrder).toEqual(['insert', 'update', 'delete']);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(uow.getNewEntities()).toHaveLength(0);
    });

    it('should rollback on error', async () => {
      // Given
      const well = Well.create({ name: 'Test Well' });
      uow.registerNew(well);

      mockTransaction.query.mockRejectedValue(new Error('Database error'));

      // When/Then
      await expect(uow.commit()).rejects.toThrow('Database error');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
```

---

## 5. Hexagonal Architecture Testing

### Testing Ports (Interfaces)

```typescript
// ports/well.repository.port.spec.ts
describe('WellRepositoryPort', () => {
  it('should define repository contract', () => {
    // This is more of a compile-time test
    const mockRepository: IWellRepositoryPort = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOperator: jest.fn(),
      delete: jest.fn(),
    };

    // Ensure interface is properly implemented
    expect(mockRepository.save).toBeDefined();
    expect(mockRepository.findById).toBeDefined();
  });
});
```

### Testing Adapters

```typescript
// adapters/postgres-well.repository.spec.ts
describe('PostgresWellRepositoryAdapter', () => {
  let adapter: PostgresWellRepositoryAdapter;
  let mockDb: jest.Mocked<PostgresClient>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;

    adapter = new PostgresWellRepositoryAdapter(mockDb);
  });

  it('should adapt domain model to database format', async () => {
    // Given
    const well = Well.create({
      name: 'Test Well',
      apiNumber: '42-123-12345',
      location: Location.create(32.7767, -96.797),
    });

    mockDb.query.mockResolvedValue({ rows: [] });

    // When
    await adapter.save(well);

    // Then
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        'Test Well',
        '42-123-12345',
        32.7767, // Latitude extracted from Location value object
        -96.797, // Longitude extracted from Location value object
      ])
    );
  });

  it('should adapt database format to domain model', async () => {
    // Given
    const dbRow = {
      id: 'well-123',
      name: 'Test Well',
      api_number: '42-123-12345',
      latitude: 32.7767,
      longitude: -96.797,
      status: 'PRODUCING',
    };

    mockDb.query.mockResolvedValue({ rows: [dbRow] });

    // When
    const result = await adapter.findById(new WellId('well-123'));

    // Then
    expect(result).toBeInstanceOf(Well);
    expect(result?.getLocation()).toBeInstanceOf(Location);
    expect(result?.getLocation().getLatitude()).toBe(32.7767);
  });
});
```

### Testing Application Services (Use Cases)

```typescript
// application/create-well.use-case.spec.ts
describe('CreateWellUseCase', () => {
  let useCase: CreateWellUseCase;
  let mockRepository: jest.Mocked<IWellRepositoryPort>;
  let mockEventPublisher: jest.Mocked<IEventPublisherPort>;
  let mockComplianceService: jest.Mocked<IComplianceServicePort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByApiNumber: jest.fn(),
    } as any;

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    mockComplianceService = {
      validateApiNumber: jest.fn(),
      registerNewWell: jest.fn(),
    } as any;

    useCase = new CreateWellUseCase(
      mockRepository,
      mockEventPublisher,
      mockComplianceService
    );
  });

  it('should orchestrate well creation across ports', async () => {
    // Given
    const request = {
      name: 'Test Well',
      apiNumber: '42-123-12345',
      operatorId: 'op-123',
    };

    mockComplianceService.validateApiNumber.mockResolvedValue(true);
    mockRepository.findByApiNumber.mockResolvedValue(null);
    mockRepository.save.mockImplementation((well) => Promise.resolve(well));
    mockComplianceService.registerNewWell.mockResolvedValue(undefined);

    // When
    const result = await useCase.execute(request);

    // Then - Verify all ports were called correctly
    expect(mockComplianceService.validateApiNumber).toHaveBeenCalledWith(
      '42-123-12345'
    );
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockComplianceService.registerNewWell).toHaveBeenCalled();
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'WellCreated' })
    );
  });
});
```

---

## 6. Factory Pattern Testing

```typescript
// well.factory.spec.ts
describe('WellFactory', () => {
  let factory: WellFactory;

  beforeEach(() => {
    factory = new WellFactory();
  });

  it('should create well with default values', () => {
    // When
    const well = factory.create();

    // Then
    expect(well).toBeInstanceOf(Well);
    expect(well.getStatus()).toBe(WellStatus.PERMITTED);
    expect(well.getId()).toBeDefined();
  });

  it('should create well with overrides', () => {
    // Given
    const overrides = {
      name: 'Custom Well',
      status: WellStatus.PRODUCING,
    };

    // When
    const well = factory.create(overrides);

    // Then
    expect(well.getName()).toBe('Custom Well');
    expect(well.getStatus()).toBe(WellStatus.PRODUCING);
  });

  it('should create well from external data', () => {
    // Given - Data from Texas RRC API
    const externalData = {
      api_number: '42-123-12345',
      operator_name: 'Test Operator',
      well_name: 'Smith #1',
      status_code: 'PR',
    };

    // When
    const well = factory.createFromRRCData(externalData);

    // Then
    expect(well.getApiNumber()).toBe('42-123-12345');
    expect(well.getStatus()).toBe(WellStatus.PRODUCING);
  });

  it('should create multiple wells for testing', () => {
    // When
    const wells = factory.createMany(5, { operatorId: 'op-123' });

    // Then
    expect(wells).toHaveLength(5);
    wells.forEach((well) => {
      expect(well.getOperatorId()).toBe('op-123');
      expect(well.getId()).toBeDefined();
      // Each should have unique ID
      const ids = wells.map((w) => w.getId().getValue());
      expect(new Set(ids).size).toBe(5);
    });
  });
});
```

---

## 7. Strategy Pattern Testing

```typescript
// production-allocation.strategy.spec.ts
describe('ProductionAllocationStrategy', () => {
  describe('WorkingInterestStrategy', () => {
    let strategy: WorkingInterestAllocationStrategy;

    beforeEach(() => {
      strategy = new WorkingInterestAllocationStrategy();
    });

    it('should allocate by working interest percentage', () => {
      // Given
      const production = { oil: 100, gas: 500, water: 50 };
      const partners = [
        { id: 'p1', workingInterest: 0.25 },
        { id: 'p2', workingInterest: 0.75 },
      ];

      // When
      const allocations = strategy.allocate(production, partners);

      // Then
      expect(allocations).toEqual([
        { partnerId: 'p1', oil: 25, gas: 125, water: 12.5 },
        { partnerId: 'p2', oil: 75, gas: 375, water: 37.5 },
      ]);
    });
  });

  describe('NetRevenueInterestStrategy', () => {
    let strategy: NetRevenueInterestStrategy;

    beforeEach(() => {
      strategy = new NetRevenueInterestStrategy();
    });

    it('should allocate after royalty deduction', () => {
      // Given
      const production = { oil: 100, gas: 500 };
      const royaltyRate = 0.125; // 1/8 royalty
      const partners = [
        { id: 'p1', workingInterest: 0.5, nri: 0.4375 },
        { id: 'p2', workingInterest: 0.5, nri: 0.4375 },
      ];

      // When
      const allocations = strategy.allocate(production, partners, royaltyRate);

      // Then
      expect(allocations).toEqual([
        { partnerId: 'p1', oil: 43.75, gas: 218.75 }, // 50% of 87.5
        { partnerId: 'p2', oil: 43.75, gas: 218.75 },
      ]);
    });
  });

  describe('StrategySelector', () => {
    let selector: AllocationStrategySelector;

    beforeEach(() => {
      selector = new AllocationStrategySelector();
    });

    it('should select strategy based on lease type', () => {
      // Given
      const federalLease = { type: LeaseType.FEDERAL, id: 'lease-1' };
      const privateLease = { type: LeaseType.PRIVATE, id: 'lease-2' };

      // When
      const federalStrategy = selector.selectStrategy(federalLease);
      const privateStrategy = selector.selectStrategy(privateLease);

      // Then
      expect(federalStrategy).toBeInstanceOf(FederalAllocationStrategy);
      expect(privateStrategy).toBeInstanceOf(WorkingInterestAllocationStrategy);
    });
  });
});
```

---

## 8. Specification Pattern Testing

```typescript
// well.specifications.spec.ts
describe('Well Specifications', () => {
  describe('ProducingWellSpecification', () => {
    let spec: ProducingWellSpecification;

    beforeEach(() => {
      spec = new ProducingWellSpecification();
    });

    it('should satisfy for producing wells', () => {
      // Given
      const producingWell = Well.create({
        name: 'Test Well',
        status: WellStatus.PRODUCING,
      });

      const drillingWell = Well.create({
        name: 'Test Well 2',
        status: WellStatus.DRILLING,
      });

      // When/Then
      expect(spec.isSatisfiedBy(producingWell)).toBe(true);
      expect(spec.isSatisfiedBy(drillingWell)).toBe(false);
    });
  });

  describe('CompositeSpecifications', () => {
    it('should combine specifications with AND', () => {
      // Given
      const producingSpec = new ProducingWellSpecification();
      const highProductionSpec = new HighProductionWellSpecification(100); // > 100 bbl/day

      const compositeSpec = producingSpec.and(highProductionSpec);

      const highProducingWell = Well.create({
        status: WellStatus.PRODUCING,
        averageDailyProduction: 150,
      });

      const lowProducingWell = Well.create({
        status: WellStatus.PRODUCING,
        averageDailyProduction: 50,
      });

      // When/Then
      expect(compositeSpec.isSatisfiedBy(highProducingWell)).toBe(true);
      expect(compositeSpec.isSatisfiedBy(lowProducingWell)).toBe(false);
    });

    it('should combine specifications with OR', () => {
      // Given
      const newWellSpec = new NewWellSpecification(); // < 30 days old
      const recentlyWorkedOverSpec = new RecentlyWorkedOverSpecification(); // workover < 90 days

      const compositeSpec = newWellSpec.or(recentlyWorkedOverSpec);

      const newWell = Well.create({ createdAt: new Date() });
      const oldWellWithWorkover = Well.create({
        createdAt: new Date('2020-01-01'),
        lastWorkoverDate: new Date(),
      });
      const oldWell = Well.create({ createdAt: new Date('2020-01-01') });

      // When/Then
      expect(compositeSpec.isSatisfiedBy(newWell)).toBe(true);
      expect(compositeSpec.isSatisfiedBy(oldWellWithWorkover)).toBe(true);
      expect(compositeSpec.isSatisfiedBy(oldWell)).toBe(false);
    });
  });

  describe('Repository Integration', () => {
    it('should filter wells using specification', async () => {
      // Given
      const repository = new WellRepository(db);
      const spec = new ProducingWellsInCountySpecification('Midland');

      // When
      const wells = await repository.findBySpecification(spec);

      // Then
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'PRODUCING' AND county = $1"),
        ['Midland']
      );
    });
  });
});
```

---

## 9. Observer Pattern Testing

```typescript
// domain-event-publisher.spec.ts
describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;
  let mockHandler1: jest.Mock;
  let mockHandler2: jest.Mock;

  beforeEach(() => {
    publisher = new DomainEventPublisher();
    mockHandler1 = jest.fn();
    mockHandler2 = jest.fn();
  });

  it('should notify all subscribers of events', () => {
    // Given
    publisher.subscribe(WellCreatedEvent, mockHandler1);
    publisher.subscribe(WellCreatedEvent, mockHandler2);

    const event = new WellCreatedEvent({
      wellId: 'well-123',
      name: 'Test Well',
      createdAt: new Date(),
    });

    // When
    publisher.publish(event);

    // Then
    expect(mockHandler1).toHaveBeenCalledWith(event);
    expect(mockHandler2).toHaveBeenCalledWith(event);
  });

  it('should handle async subscribers', async () => {
    // Given
    const asyncHandler = jest.fn().mockResolvedValue(undefined);
    publisher.subscribe(ProductionReportedEvent, asyncHandler);

    const event = new ProductionReportedEvent({
      wellId: 'well-123',
      date: new Date(),
      volumes: { oil: 100, gas: 500 },
    });

    // When
    await publisher.publishAsync(event);

    // Then
    expect(asyncHandler).toHaveBeenCalledWith(event);
  });

  it('should unsubscribe handlers', () => {
    // Given
    const unsubscribe = publisher.subscribe(WellCreatedEvent, mockHandler1);

    // When
    unsubscribe();
    publisher.publish(new WellCreatedEvent({ wellId: 'well-123' }));

    // Then
    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('should handle errors in subscribers gracefully', () => {
    // Given
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });
    const successHandler = jest.fn();

    publisher.subscribe(WellCreatedEvent, errorHandler);
    publisher.subscribe(WellCreatedEvent, successHandler);

    const event = new WellCreatedEvent({ wellId: 'well-123' });

    // When
    expect(() => publisher.publish(event)).not.toThrow();

    // Then
    expect(successHandler).toHaveBeenCalled();
  });
});
```

---

## 10. Circuit Breaker Pattern Testing

```typescript
// regulatory-api.circuit-breaker.spec.ts
describe('RegulatoryAPICircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockApiClient: jest.Mocked<RegulatoryAPIClient>;

  beforeEach(() => {
    mockApiClient = {
      submitFormPR: jest.fn(),
      checkStatus: jest.fn(),
    } as any;

    circuitBreaker = new CircuitBreaker(mockApiClient, {
      threshold: 3,
      timeout: 5000,
      resetTimeout: 10000,
    });
  });

  it('should pass through successful calls when closed', async () => {
    // Given
    mockApiClient.submitFormPR.mockResolvedValue({ id: 'submission-123' });

    // When
    const result = await circuitBreaker.call('submitFormPR', {
      /* data */
    });

    // Then
    expect(result).toEqual({ id: 'submission-123' });
    expect(circuitBreaker.getState()).toBe('CLOSED');
  });

  it('should open circuit after threshold failures', async () => {
    // Given
    mockApiClient.submitFormPR.mockRejectedValue(new Error('API Error'));

    // When - Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.call('submitFormPR', {})).rejects.toThrow(
        'API Error'
      );
    }

    // Then - Circuit should be open
    expect(circuitBreaker.getState()).toBe('OPEN');

    // And - Subsequent calls should fail fast
    await expect(circuitBreaker.call('submitFormPR', {})).rejects.toThrow(
      'Circuit breaker is OPEN'
    );

    expect(mockApiClient.submitFormPR).toHaveBeenCalledTimes(3);
  });

  it('should enter half-open state after reset timeout', async () => {
    // Given - Open the circuit
    mockApiClient.submitFormPR.mockRejectedValue(new Error('API Error'));
    for (let i = 0; i < 3; i++) {
      await circuitBreaker.call('submitFormPR', {}).catch(() => {});
    }
    expect(circuitBreaker.getState()).toBe('OPEN');

    // When - Wait for reset timeout
    jest.advanceTimersByTime(10000);

    // Then - Should be half-open
    expect(circuitBreaker.getState()).toBe('HALF_OPEN');

    // And - Allow one test call
    mockApiClient.submitFormPR.mockResolvedValue({ id: 'test-123' });
    await circuitBreaker.call('submitFormPR', {});

    // Circuit should close on success
    expect(circuitBreaker.getState()).toBe('CLOSED');
  });
});
```

---

## 11. Anti-Corruption Layer Testing

```typescript
// texas-rrc-api.adapter.spec.ts
describe('TexasRRCApiAdapter', () => {
  let adapter: TexasRRCApiAdapter;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    } as any;

    adapter = new TexasRRCApiAdapter(mockHttpClient);
  });

  it('should translate domain model to external API format', async () => {
    // Given - Our domain model
    const formPR = FormPR.create({
      operatorNumber: '123456',
      reportingMonth: new Date('2024-09-01'),
      wells: [
        {
          apiNumber: '42-123-12345',
          oilProduction: 1500.5,
          gasProduction: 4500.2,
        },
      ],
    });

    // Mock external API response
    mockHttpClient.post.mockResolvedValue({
      status: 'SUCCESS',
      confirmation_number: 'TX-2024-09-123456',
    });

    // When
    const result = await adapter.submitFormPR(formPR);

    // Then - Verify translation to external format
    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/form-pr', {
      operator_no: '123456', // External field name
      report_period: '2024-09', // External date format
      production_data: [
        {
          api_no: '42-123-12345', // External field name
          oil_bbls: 1501, // Rounded per RRC requirements
          gas_mcf: 4500,
          casinghead_gas_mcf: 0,
        },
      ],
    });

    // And - Result translated back to domain
    expect(result).toEqual({
      status: 'SUBMITTED',
      confirmationNumber: 'TX-2024-09-123456',
    });
  });

  it('should handle external API errors gracefully', async () => {
    // Given - External API error
    mockHttpClient.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          error_code: 'INVALID_API_NUMBER',
          message: 'API number format is invalid',
        },
      },
    });

    const formPR = FormPR.create({
      /* ... */
    });

    // When/Then
    await expect(adapter.submitFormPR(formPR)).rejects.toThrow(
      InvalidApiNumberError // Translated to domain exception
    );
  });

  it('should map external data to domain models', async () => {
    // Given - External API response
    mockHttpClient.get.mockResolvedValue({
      well_data: {
        api_no: '42-123-12345',
        operator: {
          number: '123456',
          name: 'TEST OPERATOR INC',
        },
        location: {
          county_code: '123',
          lat: '32.7767',
          lng: '-96.797',
        },
        status_code: 'PR',
      },
    });

    // When
    const well = await adapter.getWellByApiNumber('42-123-12345');

    // Then - Translated to domain model
    expect(well).toBeInstanceOf(Well);
    expect(well.getApiNumber()).toBe('42-123-12345');
    expect(well.getStatus()).toBe(WellStatus.PRODUCING);
    expect(well.getLocation().getLatitude()).toBe(32.7767);
  });
});
```

---

## 12. Retry Pattern Testing

```typescript
// retry-policy.spec.ts
describe('RetryPolicy', () => {
  let retryPolicy: RetryPolicy;
  let mockOperation: jest.Mock;

  beforeEach(() => {
    retryPolicy = new RetryPolicy({
      maxAttempts: 3,
      delay: 100,
      backoffMultiplier: 2,
      retryableErrors: [NetworkError, TimeoutError],
    });

    mockOperation = jest.fn();
  });

  it('should succeed on first attempt', async () => {
    // Given
    mockOperation.mockResolvedValue('success');

    // When
    const result = await retryPolicy.execute(mockOperation);

    // Then
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    // Given
    mockOperation
      .mockRejectedValueOnce(new NetworkError('Connection failed'))
      .mockRejectedValueOnce(new TimeoutError('Request timeout'))
      .mockResolvedValue('success');

    // When
    const result = await retryPolicy.execute(mockOperation);

    // Then
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    // Given
    mockOperation.mockRejectedValue(new ValidationError('Invalid data'));

    // When/Then
    await expect(retryPolicy.execute(mockOperation)).rejects.toThrow(
      ValidationError
    );
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('should apply exponential backoff', async () => {
    // Given
    mockOperation
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValue('success');

    const delaySpy = jest.spyOn(global, 'setTimeout');

    // When
    await retryPolicy.execute(mockOperation);

    // Then
    expect(delaySpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(delaySpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
  });

  it('should fail after max attempts', async () => {
    // Given
    mockOperation.mockRejectedValue(new NetworkError('Persistent failure'));

    // When/Then
    await expect(retryPolicy.execute(mockOperation)).rejects.toThrow(
      'Max retry attempts (3) exceeded'
    );
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });
});
```

---

## 13. DTO Pattern Testing

```typescript
// well.dto.spec.ts
describe('Well DTOs', () => {
  describe('CreateWellDto', () => {
    it('should validate required fields', () => {
      // Given
      const dto = new CreateWellDto();
      dto.name = ''; // Invalid
      dto.apiNumber = 'invalid'; // Invalid format

      // When
      const errors = validateSync(dto);

      // Then
      expect(errors).toHaveLength(2);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(errors[1].constraints).toHaveProperty('matches');
    });

    it('should transform input data', () => {
      // Given
      const dto = plainToClass(CreateWellDto, {
        name: '  Test Well  ',
        apiNumber: '42-123-12345',
        spudDate: '2024-01-15', // String date
      });

      // When
      const transformed = dto.transform();

      // Then
      expect(transformed.name).toBe('Test Well'); // Trimmed
      expect(transformed.spudDate).toBeInstanceOf(Date);
    });
  });

  describe('WellResponseDto', () => {
    it('should map domain entity to response', () => {
      // Given
      const well = Well.create({
        id: 'well-123',
        name: 'Test Well',
        apiNumber: '42-123-12345',
        status: WellStatus.PRODUCING,
        createdAt: new Date('2024-01-01'),
      });

      // When
      const dto = WellResponseDto.fromDomain(well);

      // Then
      expect(dto).toEqual({
        id: 'well-123',
        name: 'Test Well',
        apiNumber: '42-123-12345',
        status: 'PRODUCING',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should exclude sensitive fields', () => {
      // Given
      const well = Well.create({
        name: 'Test Well',
        internalNotes: 'Sensitive information', // Should not be in DTO
      });

      // When
      const dto = WellResponseDto.fromDomain(well);

      // Then
      expect(dto).not.toHaveProperty('internalNotes');
    });
  });
});
```

---

## 14. RBAC-CASL Testing

```typescript
// abilities.factory.spec.ts
describe('AbilitiesFactory', () => {
  let factory: AbilitiesFactory;

  beforeEach(() => {
    factory = new AbilitiesFactory();
  });

  describe('Owner abilities', () => {
    it('should grant full access to owners', () => {
      // Given
      const user = {
        id: 'user-123',
        role: UserRole.OWNER,
        organizationId: 'org-123',
      };

      // When
      const ability = factory.createForUser(user);

      // Then
      expect(ability.can('manage', 'all')).toBe(true);
      expect(
        ability.can('delete', subject('Well', { organizationId: 'org-123' }))
      ).toBe(true);
      expect(
        ability.can(
          'update',
          subject('Production', { organizationId: 'org-123' })
        )
      ).toBe(true);
    });
  });

  describe('Manager abilities', () => {
    it('should grant operational access to managers', () => {
      // Given
      const user = {
        id: 'user-456',
        role: UserRole.MANAGER,
        organizationId: 'org-123',
      };

      // When
      const ability = factory.createForUser(user);

      // Then
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-123' }))
      ).toBe(true);
      expect(
        ability.can(
          'update',
          subject('Production', { organizationId: 'org-123' })
        )
      ).toBe(true);
      expect(
        ability.can('delete', subject('Well', { organizationId: 'org-123' }))
      ).toBe(false);
      expect(ability.can('manage', 'Billing')).toBe(false);
    });
  });

  describe('Pumper abilities', () => {
    it('should grant limited access to pumpers', () => {
      // Given
      const user = {
        id: 'user-789',
        role: UserRole.PUMPER,
        organizationId: 'org-123',
        assignedWells: ['well-1', 'well-2'],
      };

      // When
      const ability = factory.createForUser(user);

      // Then
      expect(ability.can('read', subject('Well', { id: 'well-1' }))).toBe(true);
      expect(ability.can('create', 'Production')).toBe(true);
      expect(
        ability.can(
          'update',
          subject('Production', {
            wellId: 'well-1',
            createdBy: 'user-789',
          })
        )
      ).toBe(true);
      expect(
        ability.can(
          'update',
          subject('Production', {
            wellId: 'well-3', // Not assigned
          })
        )
      ).toBe(false);
      expect(ability.can('read', 'Financial')).toBe(false);
    });
  });

  describe('Cross-organization access', () => {
    it('should prevent access across organizations', () => {
      // Given
      const user = {
        id: 'user-123',
        role: UserRole.OWNER,
        organizationId: 'org-123',
      };

      // When
      const ability = factory.createForUser(user);

      // Then
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-456' }))
      ).toBe(false);
      expect(
        ability.can('manage', subject('Well', { organizationId: 'org-456' }))
      ).toBe(false);
    });
  });
});

// abilities.guard.spec.ts
describe('AbilitiesGuard', () => {
  let guard: AbilitiesGuard;
  let factory: jest.Mocked<AbilitiesFactory>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    factory = { createForUser: jest.fn() } as any;
    reflector = { get: jest.fn() } as any;
    guard = new AbilitiesGuard(factory, reflector);
  });

  it('should allow access when user has required ability', () => {
    // Given
    const context = createExecutionContext({
      user: { id: 'user-123', role: UserRole.OWNER },
      handler: 'deleteWell',
    });

    reflector.get.mockReturnValue({ action: 'delete', subject: 'Well' });

    const ability = createMockAbility();
    ability.can.mockReturnValue(true);
    factory.createForUser.mockReturnValue(ability);

    // When
    const result = guard.canActivate(context);

    // Then
    expect(result).toBe(true);
  });

  it('should deny access when user lacks required ability', () => {
    // Given
    const context = createExecutionContext({
      user: { id: 'user-123', role: UserRole.PUMPER },
      handler: 'deleteWell',
    });

    reflector.get.mockReturnValue({ action: 'delete', subject: 'Well' });

    const ability = createMockAbility();
    ability.can.mockReturnValue(false);
    factory.createForUser.mockReturnValue(ability);

    // When/Then
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

---

## 15. SOLID Principles Testing

### Single Responsibility Principle

```typescript
// Test that each class has one reason to change
describe('WellService - SRP', () => {
  it('should only handle well business logic', () => {
    const service = new WellService(repository, eventBus);

    // Should have well-related methods
    expect(service.createWell).toBeDefined();
    expect(service.updateWellStatus).toBeDefined();

    // Should NOT have unrelated concerns
    expect(service.sendEmail).toBeUndefined();
    expect(service.generatePDF).toBeUndefined();
    expect(service.calculateTax).toBeUndefined();
  });
});
```

### Open/Closed Principle

```typescript
// Test that behavior can be extended without modification
describe('PaymentProcessor - OCP', () => {
  it('should accept new payment strategies without modification', () => {
    // Given - Original payment strategies
    const processor = new PaymentProcessor();
    processor.registerStrategy('ACH', new ACHPaymentStrategy());
    processor.registerStrategy('CHECK', new CheckPaymentStrategy());

    // When - Add new strategy without modifying processor
    processor.registerStrategy('WIRE', new WireTransferStrategy());

    // Then
    const payment = { amount: 1000, method: 'WIRE' };
    const result = processor.process(payment);
    expect(result.method).toBe('WIRE');
  });
});
```

### Liskov Substitution Principle

```typescript
// Test that derived classes can substitute base classes
describe('Well Types - LSP', () => {
  it('should handle all well types uniformly', () => {
    // Given
    const wells: Well[] = [
      new OilWell({ name: 'Oil Well' }),
      new GasWell({ name: 'Gas Well' }),
      new InjectionWell({ name: 'Injection Well' }),
    ];

    // When/Then - All should work with base class contract
    wells.forEach((well) => {
      expect(well.calculateProduction()).toBeGreaterThanOrEqual(0);
      expect(well.getStatus()).toBeDefined();
      expect(well.canProduce()).toBe(typeof true);
    });
  });
});
```

### Interface Segregation Principle

```typescript
// Test that interfaces are focused and cohesive
describe('Repository Interfaces - ISP', () => {
  it('should have segregated interfaces for different operations', () => {
    // Read-only repository
    const readRepo: IReadRepository<Well> = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    // Write repository
    const writeRepo: IWriteRepository<Well> = {
      save: jest.fn(),
      delete: jest.fn(),
    };

    // Clients depend only on what they need
    const reportService = new ReportService(readRepo); // Only needs read
    const maintenanceService = new MaintenanceService(writeRepo); // Only needs write
  });
});
```

### Dependency Inversion Principle

```typescript
// Test that high-level modules don't depend on low-level modules
describe('NotificationService - DIP', () => {
  it('should depend on abstractions not concretions', () => {
    // Given - Abstractions
    const emailSender: INotificationSender = new MockEmailSender();
    const smsSender: INotificationSender = new MockSMSSender();

    // When - Service depends on abstraction
    const service = new NotificationService([emailSender, smsSender]);

    // Then - Can work with any implementation
    service.notify('Test message');
    expect(emailSender.send).toHaveBeenCalled();
    expect(smsSender.send).toHaveBeenCalled();
  });
});
```

---

## Integration Test Example: Complete Workflow

```typescript
// well-lifecycle.integration.spec.ts
describe('Well Lifecycle Integration', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventStore: EventStore;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    eventStore = module.get(EventStore);

    await app.init();
  });

  it('should handle complete well lifecycle', async () => {
    // Step 1: Create Well
    const createCommand = new CreateWellCommand({
      name: 'Integration Test Well',
      apiNumber: '42-999-88888',
      operatorId: 'op-123',
    });

    const wellId = await commandBus.execute(createCommand);
    expect(wellId).toBeDefined();

    // Verify event was published
    const createdEvents = await eventStore.getEvents(wellId);
    expect(createdEvents).toContainEqual(
      expect.objectContaining({ type: 'WellCreated' })
    );

    // Step 2: Start Drilling
    const drillCommand = new StartDrillingCommand(wellId);
    await commandBus.execute(drillCommand);

    // Query current status
    const wellQuery = new GetWellByIdQuery(wellId);
    const well = await queryBus.execute(wellQuery);
    expect(well.status).toBe('DRILLING');

    // Step 3: Complete Well
    const completeCommand = new CompleteWellCommand(wellId, {
      completionDate: new Date(),
      totalDepth: 10000,
    });
    await commandBus.execute(completeCommand);

    // Step 4: Report Production
    const productionCommand = new ReportProductionCommand({
      wellId,
      date: new Date(),
      oilVolume: 100,
      gasVolume: 500,
    });
    await commandBus.execute(productionCommand);

    // Step 5: Query Production Summary
    const summaryQuery = new GetProductionSummaryQuery({
      wellIds: [wellId],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    const summary = await queryBus.execute(summaryQuery);

    expect(summary.totalOilProduction).toBe(100);
    expect(summary.totalGasProduction).toBe(500);

    // Verify complete event stream
    const allEvents = await eventStore.getEvents(wellId);
    expect(allEvents.map((e) => e.type)).toEqual([
      'WellCreated',
      'DrillingStarted',
      'WellCompleted',
      'ProductionReported',
    ]);
  });
});
```

---

## Testing Best Practices Summary

### 1. **Test Pyramid**

- 60% Unit Tests (Fast, isolated)
- 30% Integration Tests (Database, external services)
- 10% E2E Tests (Complete workflows)

### 2. **Mock vs Real**

- Mock for unit tests
- Real database for integration tests
- Full stack for E2E tests

### 3. **Test Organization**

```
src/
  domain/
    entities/
      __tests__/
        well.entity.spec.ts
    value-objects/
      __tests__/
        money.value-object.spec.ts
  application/
    commands/
      __tests__/
        create-well.command.spec.ts
  infrastructure/
    repositories/
      __tests__/
        well.repository.spec.ts
        well.repository.integration.spec.ts
```

### 4. **Test Data Builders**

```typescript
const well = aWell()
  .withName('Test Well')
  .withStatus(WellStatus.PRODUCING)
  .withProduction(100, 500)
  .build();
```

### 5. **Import Path Management**

- **Critical**: Always verify import paths are correct relative to the test file
  location
- Use `../../../` for domain layer imports from infrastructure/presentation
  layers
- Use `../../` for application layer imports from infrastructure layer
- Run tests after refactoring to catch broken imports immediately

### 6. **Assertions**

- Test behavior, not implementation
- Verify state changes
- Check event emissions
- Validate error conditions
- Use appropriate matchers (`toBeInstanceOf`, `toMatchObject`, `toContainEqual`)

### 7. **Database UUID Handling**

- Ensure all ID fields expecting UUIDs receive proper UUID values
- Use `randomUUID()` from `crypto` module for generating test IDs
- Database schemas may expect UUID format for foreign keys and identifiers

---

This comprehensive guide covers testing strategies for all backend patterns in
WellFlow. Each pattern has specific testing considerations, but they all follow
the same principles: isolation, clarity, and thorough coverage of both success
and failure paths.
