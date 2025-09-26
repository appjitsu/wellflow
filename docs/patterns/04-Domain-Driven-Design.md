# Domain-Driven Design (DDD) Pattern

## Overview

Domain-Driven Design is a software design approach that focuses on modeling
software to match the business domain. It emphasizes collaboration between
domain experts and developers to create a shared understanding of the problem
space through a ubiquitous language.

## Core Concepts

### Domain Model

The heart of DDD, representing the business logic and rules.

### Ubiquitous Language

A common vocabulary shared by all team members, including domain experts and
developers.

### Bounded Context

Clear boundaries that define where a particular model applies and where it
doesn't.

### Aggregates

Clusters of domain objects that can be treated as a single unit for data
changes.

### Entities

Objects that have a distinct identity that runs through time and different
representations.

### Value Objects

Objects that describe characteristics of a thing but have no identity.

## Benefits

- **Better Business Alignment**: Software structure reflects business domain
- **Improved Communication**: Ubiquitous language reduces misunderstandings
- **Maintainable Code**: Clear domain boundaries and responsibilities
- **Flexibility**: Well-defined contexts allow for independent evolution
- **Rich Domain Models**: Business logic is centralized and explicit

## Implementation in Our Project

### Before: Anemic Domain Model

```typescript
// Anemic entity with just data
class Vendor {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Business logic scattered in services
class VendorService {
  async activateVendor(vendorId: string) {
    const vendor = await this.repository.findById(vendorId);
    if (!vendor) throw new Error('Vendor not found');

    // Business rules scattered across services
    if (vendor.status === 'BLOCKED') {
      throw new Error('Cannot activate blocked vendor');
    }

    vendor.status = 'ACTIVE';
    vendor.updatedAt = new Date();

    await this.repository.save(vendor);
    await this.auditService.log('VENDOR_ACTIVATED', vendor.id);
  }
}
```

### After: Rich Domain Model

```typescript
// Rich domain entity with behavior
export class Vendor {
  private constructor(
    private readonly id: VendorId,
    private readonly organizationId: string,
    private name: VendorName,
    private code: VendorCode,
    private status: VendorStatus,
    private contactInfo: ContactInfo,
    private insurance: Insurance,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly domainEvents: DomainEvent[] = []
  ) {}

  // Factory method
  static create(data: CreateVendorData): Vendor {
    const vendor = new Vendor(
      VendorId.generate(),
      data.organizationId,
      new VendorName(data.name),
      new VendorCode(data.code),
      VendorStatus.PENDING,
      new ContactInfo(data.contactInfo),
      new Insurance(data.insurance),
      new Date(),
      new Date()
    );

    vendor.addDomainEvent(
      new VendorCreatedEvent(vendor.id, vendor.organizationId)
    );
    return vendor;
  }

  // Business behavior encapsulated
  activate(): void {
    if (this.status.isBlocked()) {
      throw new VendorDomainError('Cannot activate blocked vendor');
    }

    if (this.status.isActive()) {
      return; // Already active, no-op
    }

    this.status = VendorStatus.ACTIVE;
    this.updatedAt = new Date();
    this.addDomainEvent(new VendorActivatedEvent(this.id));
  }

  // Invariants enforced
  updateInsurance(insurance: Insurance): void {
    if (this.status.isActive() && !insurance.isValid()) {
      throw new VendorDomainError('Active vendors must have valid insurance');
    }

    this.insurance = insurance;
    this.updatedAt = new Date();
  }

  // Domain events for side effects
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): readonly DomainEvent[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents.length = 0;
  }
}

// Value Objects with validation
export class VendorName {
  private readonly value: string;

  constructor(name: string) {
    if (!name || name.trim().length === 0) {
      throw new VendorDomainError('Vendor name is required');
    }

    if (name.length > 255) {
      throw new VendorDomainError('Vendor name cannot exceed 255 characters');
    }

    this.value = name.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VendorName): boolean {
    return this.value === other.value;
  }
}

// Domain Services for complex business logic
export class VendorDomainService {
  constructor(private readonly vendorRepository: IVendorRepository) {}

  async canDeactivateVendor(vendorId: VendorId): Promise<boolean> {
    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) return false;

    // Complex business rule involving multiple aggregates
    const activeContracts =
      await this.vendorRepository.countActiveContracts(vendorId);
    const pendingPayments =
      await this.vendorRepository.countPendingPayments(vendorId);

    return activeContracts === 0 && pendingPayments === 0;
  }
}
```

### Bounded Context Example

```typescript
// Vendor Management Context
export namespace VendorManagement {
  export class Vendor {
    // Focus on vendor lifecycle, compliance, contracts
  }

  export class VendorRepository {
    // Persistence specific to vendor management
  }
}

// Financial Context
export namespace Financial {
  export class Vendor {
    // Focus on payment terms, tax info, banking
  }

  export class PaymentRepository {
    // Persistence specific to payments
  }
}

// The same real-world entity (vendor) has different representations
// in different contexts based on what's relevant in that context
```

### Application Service (Orchestration)

```typescript
@Injectable()
export class CreateVendorHandler
  implements ICommandHandler<CreateVendorCommand>
{
  constructor(
    private readonly vendorRepository: IVendorRepository,
    private readonly domainEventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: CreateVendorCommand): Promise<string> {
    // Check uniqueness (domain rule)
    const existingVendor = await this.vendorRepository.findByCode(
      new VendorCode(command.code)
    );

    if (existingVendor) {
      throw new VendorAlreadyExistsError(command.code);
    }

    // Create rich domain object
    const vendor = Vendor.create({
      organizationId: command.organizationId,
      name: command.name,
      code: command.code,
      contactInfo: command.contactInfo,
      insurance: command.insurance,
    });

    // Persist
    await this.vendorRepository.save(vendor);

    // Publish domain events
    const events = vendor.getDomainEvents();
    for (const event of events) {
      await this.domainEventPublisher.publish(event);
    }

    vendor.clearDomainEvents();

    return vendor.getId().getValue();
  }
}
```

## DDD Layers in Our Architecture

### 1. Domain Layer (Core)

- **Entities**: `Vendor`, `LeaseOperatingStatement`, `User`
- **Value Objects**: `VendorCode`, `StatementMonth`, `Money`
- **Domain Services**: `VendorDomainService`
- **Domain Events**: `VendorCreatedEvent`, `LosFinalized`
- **Repositories (Interfaces)**: `IVendorRepository`

### 2. Application Layer

- **Command Handlers**: `CreateVendorHandler`, `FinalizeLosHandler`
- **Query Handlers**: `GetVendorByIdHandler`
- **Application Services**: Orchestration of domain operations
- **DTOs**: Data transfer between boundaries

### 3. Infrastructure Layer

- **Repository Implementations**: `VendorRepositoryImpl`
- **Database Schemas**: Drizzle ORM schemas
- **External Services**: Email, notifications
- **Event Publishers**: Domain event infrastructure

### 4. Presentation Layer

- **Controllers**: REST API endpoints
- **Guards**: Authentication and authorization
- **Validation**: Input validation pipes

## Common DDD Patterns in Our Codebase

### Aggregate Root

```typescript
export class LeaseOperatingStatement {
  // Aggregate root that controls access to expense line items
  private expenseLineItems: ExpenseLineItem[] = [];

  addExpense(expense: ExpenseLineItemData): void {
    // Business rules enforced at aggregate level
    if (this.status.isFinalized()) {
      throw new LosDomainError('Cannot add expenses to finalized LOS');
    }

    const expenseItem = ExpenseLineItem.create(expense);
    this.expenseLineItems.push(expenseItem);
    this.recalculateTotals();

    this.addDomainEvent(new ExpenseAddedEvent(this.id, expenseItem.id));
  }

  // Aggregate consistency
  private recalculateTotals(): void {
    this.totalExpenses = Money.sum(
      ...this.expenseLineItems.map((item) => item.amount)
    );
  }
}
```

### Repository Pattern (Domain Interface)

```typescript
export interface IVendorRepository {
  findById(id: VendorId): Promise<Vendor | null>;
  findByCode(code: VendorCode): Promise<Vendor | null>;
  save(vendor: Vendor): Promise<void>;
  delete(id: VendorId): Promise<void>;

  // Domain-specific queries
  findActiveVendorsByOrganization(orgId: string): Promise<Vendor[]>;
  findVendorsWithExpiredInsurance(): Promise<Vendor[]>;
}
```

### Domain Events

```typescript
export class VendorActivatedEvent implements DomainEvent {
  constructor(
    public readonly vendorId: VendorId,
    public readonly occurredAt: Date = new Date()
  ) {}

  getAggregateId(): string {
    return this.vendorId.getValue();
  }

  getEventName(): string {
    return 'VendorActivated';
  }
}

// Event Handler (Application Layer)
@EventHandler(VendorActivatedEvent)
export class VendorActivatedEventHandler {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: VendorActivatedEvent): Promise<void> {
    await this.notificationService.notifyVendorActivated(event.vendorId);
  }
}
```

## Best Practices

### 1. Ubiquitous Language

- Use domain terminology consistently across code and documentation
- Avoid technical jargon in domain models
- Regular sessions with domain experts to refine language

### 2. Aggregate Design

- Keep aggregates small and focused
- Enforce invariants within aggregate boundaries
- Use eventual consistency between aggregates

### 3. Domain Events

- Use events for side effects and cross-aggregate communication
- Keep events focused on domain concepts
- Handle events asynchronously when possible

### 4. Value Objects

- Make them immutable
- Implement proper equality
- Encapsulate validation logic

### 5. Bounded Context Integration

- Use Anti-Corruption Layer for external systems
- Define clear contracts between contexts
- Avoid sharing domain models across contexts

## Anti-Patterns to Avoid

### 1. Anemic Domain Model

```typescript
// DON'T: All logic in services
class VendorService {
  activate(vendor: Vendor) {
    vendor.status = 'ACTIVE'; // Just data manipulation
  }
}
```

### 2. Leaky Abstractions

```typescript
// DON'T: Domain depending on infrastructure
class Vendor {
  constructor(private db: Database) {} // Infrastructure leak
}
```

### 3. God Aggregates

```typescript
// DON'T: One aggregate handling everything
class Organization {
  vendors: Vendor[];
  users: User[];
  leases: Lease[];
  contracts: Contract[];
  // Too many responsibilities
}
```

### 4. Technical Ubiquitous Language

```typescript
// DON'T: Technical terms in domain
class VendorEntity {
  pk: string; // Use business terms like 'id' or 'vendorId'
}
```

## Testing Domain Models

### Unit Testing Entities

```typescript
describe('Vendor', () => {
  describe('activate', () => {
    it('should activate pending vendor', () => {
      // Given
      const vendor = createVendorWithStatus(VendorStatus.PENDING);

      // When
      vendor.activate();

      // Then
      expect(vendor.isActive()).toBe(true);
      expect(vendor.getDomainEvents()).toContainEqual(
        expect.any(VendorActivatedEvent)
      );
    });

    it('should not activate blocked vendor', () => {
      // Given
      const vendor = createVendorWithStatus(VendorStatus.BLOCKED);

      // When/Then
      expect(() => vendor.activate()).toThrow(VendorDomainError);
    });
  });
});
```

### Integration Testing with Repository

```typescript
describe('VendorRepository', () => {
  it('should persist vendor aggregate', async () => {
    // Given
    const vendor = Vendor.create(validVendorData);

    // When
    await vendorRepository.save(vendor);

    // Then
    const savedVendor = await vendorRepository.findById(vendor.getId());
    expect(savedVendor).toEqual(vendor);
  });
});
```

DDD provides a structured approach to building software that truly reflects the
business domain, leading to more maintainable and business-aligned code. In our
oil & gas management system, it helps us model complex business rules around
vendors, lease operating statements, and revenue distribution in a way that
domain experts can understand and validate.
