# SOLID Architecture Implementation for Multi-Tenant RLS

## Overview

This document describes the SOLID-compliant architecture implemented for the
WellFlow multi-tenant Row Level Security (RLS) system. The refactoring follows
Clean Architecture principles, Domain-Driven Design (DDD), and all SOLID
principles.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

**Purpose**: Contains core business logic and rules, independent of external
concerns.

#### Value Objects

- **`TenantContext`** (`domain/value-objects/tenant-context.vo.ts`)
  - Immutable representation of tenant information
  - Encapsulates validation logic
  - Factory methods for creation and conversion
  - Follows Value Object pattern from DDD

#### Domain Services

- **`TenantIsolationDomainService`**
  (`domain/services/tenant-isolation.domain-service.ts`)
  - Contains core business rules for tenant isolation
  - Validates tenant access permissions
  - Implements role-based authorization logic
  - Pure business logic, no infrastructure dependencies

#### Domain Errors

- **`TenantAccessDeniedError`** (`domain/errors/tenant-access-denied.error.ts`)
  - Domain-specific error for tenant violations
  - Factory methods for different error scenarios
  - Structured error information for logging

### 2. Application Layer (`src/application/`)

**Purpose**: Orchestrates domain objects and implements use cases.

#### Interfaces

- **`ITenantIsolationStrategy`** - Strategy pattern for different isolation
  methods
- **`ITenantContextManager`** - Interface for context management
- **`IDatabaseConnectionManager`** - Interface for database connections
- **`ITenantAwareRepository<T>`** - Interface for tenant-aware data access

#### Use Cases

- **`SetTenantContextUseCase`** - Sets tenant context with validation
- **`ClearTenantContextUseCase`** - Clears tenant context
- **`ValidateTenantAccessUseCase`** - Validates tenant access permissions

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Implements interfaces defined in application layer, handles
external concerns.

#### Tenant Management

- **`RlsTenantIsolationStrategy`** - PostgreSQL RLS implementation
- **`DatabaseConnectionService`** - Database connection management (SRP)
- **`TenantContextManagerService`** - Request-scoped context management
- **`DrizzleDatabaseService`** - Drizzle ORM integration

#### Repository Pattern

- **`TenantAwareRepositoryBase<T>`** - Base class with tenant utilities
- Provides common tenant filtering and validation methods
- Concrete repositories extend this base class

### 4. Presentation Layer (`src/common/tenant/`)

**Purpose**: Handles HTTP concerns and integrates with NestJS framework.

#### Guards and Services

- **`TenantGuard`** - NestJS guard for tenant context setting
- **`TenantRlsService`** - Facade service for backward compatibility
- **`TenantModule`** - NestJS module configuration

## SOLID Principles Implementation

### Single Responsibility Principle (SRP) ✅

**Before**: `DatabaseService` handled both database connections AND RLS context
management.

**After**:

- `DatabaseConnectionService` - Only handles database connections
- `RlsTenantIsolationStrategy` - Only handles RLS context management
- `TenantIsolationDomainService` - Only handles business rules
- `TenantContextManagerService` - Only handles context management

### Open/Closed Principle (OCP) ✅

**Strategy Pattern Implementation**:

- `ITenantIsolationStrategy` interface allows different isolation strategies
- `RlsTenantIsolationStrategy` implements PostgreSQL RLS
- Can easily add `QueryFilterStrategy`, `SchemaIsolationStrategy`, etc.
- No modification of existing code required for new strategies

### Liskov Substitution Principle (LSP) ✅

**Interface Implementations**:

- All implementations properly fulfill their interface contracts
- `RlsTenantIsolationStrategy` can be substituted with any
  `ITenantIsolationStrategy`
- Repository implementations can be substituted without breaking functionality

### Interface Segregation Principle (ISP) ✅

**Focused Interfaces**:

- `ITenantContextManager` - Only context management methods
- `IDatabaseConnectionManager` - Only connection management methods
- `ITenantIsolationStrategy` - Only isolation strategy methods
- No client depends on methods it doesn't use

### Dependency Inversion Principle (DIP) ✅

**Dependency Injection**:

- High-level modules depend on abstractions (interfaces)
- `SetTenantContextUseCase` depends on `ITenantIsolationStrategy`, not concrete
  implementation
- `TenantAwareRepositoryBase` depends on `ITenantContextManager` interface
- Concrete implementations are injected via NestJS DI container

## Clean Architecture Implementation

### Dependency Direction

```
Presentation → Application → Domain
Infrastructure → Application → Domain
```

- **Domain** has no dependencies on other layers
- **Application** depends only on Domain
- **Infrastructure** implements Application interfaces
- **Presentation** orchestrates Application use cases

### Layer Isolation

- Domain logic is pure and testable
- Application use cases are framework-agnostic
- Infrastructure details are abstracted behind interfaces
- Presentation layer is thin and focused on HTTP concerns

## Design Patterns Used

### 1. Strategy Pattern

- `ITenantIsolationStrategy` with `RlsTenantIsolationStrategy` implementation
- Allows switching between different tenant isolation methods

### 2. Repository Pattern

- `TenantAwareRepositoryBase<T>` provides common tenant functionality
- Concrete repositories extend base class for specific entities

### 3. Factory Pattern

- `TenantContext.create()` and `TenantContext.fromPlainObject()` factory methods
- `TenantAccessDeniedError` factory methods for different scenarios

### 4. Facade Pattern

- `TenantRlsService` provides simplified interface for complex tenant operations
- Maintains backward compatibility while using new architecture

### 5. Template Method Pattern

- `TenantAwareRepositoryBase<T>` provides template methods for common operations
- Subclasses can override specific behavior while maintaining structure

## Benefits Achieved

### 1. Maintainability

- Clear separation of concerns
- Each class has a single responsibility
- Easy to locate and modify specific functionality

### 2. Testability

- Domain logic is pure and easily testable
- Dependencies are injected and can be mocked
- Use cases are framework-agnostic

### 3. Extensibility

- New tenant isolation strategies can be added without modifying existing code
- New use cases can be added following established patterns
- Repository pattern allows easy addition of new entities

### 4. Flexibility

- Can switch between different isolation strategies
- Framework-agnostic core logic
- Easy to adapt to different deployment scenarios

### 5. Compliance

- Follows industry best practices
- Implements proven architectural patterns
- Maintains backward compatibility during migration

## Migration Strategy

The refactoring maintains backward compatibility:

1. **Legacy Services Preserved**: Original services still work
2. **Gradual Migration**: New features use new architecture
3. **Interface Compatibility**: Existing APIs unchanged
4. **Test Coverage Maintained**: All existing tests pass

## Next Steps

1. **Migrate Existing Repositories**: Update to extend
   `TenantAwareRepositoryBase<T>`
2. **Add New Isolation Strategies**: Implement query-based filtering for non-RLS
   databases
3. **Enhance Domain Services**: Add more sophisticated business rules
4. **Performance Optimization**: Add caching strategies for tenant context
5. **Monitoring Integration**: Add observability for tenant operations

## Conclusion

The SOLID-compliant architecture provides a robust, maintainable, and extensible
foundation for multi-tenant data isolation. The implementation follows industry
best practices while maintaining practical usability and backward compatibility.
