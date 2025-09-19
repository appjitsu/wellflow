# Sprint 2: Database Schema & Core API Foundation

## Sprint Overview

**Duration:** 3 weeks  
**Story Points:** 13 points  
**Sprint Goal:** Implement complete database schema, core API architecture, and
foundational backend services for WellFlow MVP.

## Sprint Objectives

1. Implement complete database schema with Drizzle ORM
2. Build core NestJS API architecture with modules
3. Establish multi-tenant data isolation with RLS
4. Create foundational API endpoints and validation
5. Implement background job processing with BullMQ

## Deliverables

### 1. Database Schema Implementation

- **Core Entity Tables**
  - Organizations (multi-tenant root)
  - Users with role-based structure
  - Leases with legal descriptions
  - Wells with API number validation
  - Production records with TimescaleDB optimization
- **Relationship Tables**
  - Partners and lease partnerships
  - Equipment and well associations
  - Documents with metadata
- **Compliance Tables**
  - Compliance reports structure
  - JIB statements framework

### 2. Drizzle ORM Configuration

- **Schema Definitions**
  - TypeScript-first schema files
  - Relationship definitions and foreign keys
  - Index optimization for performance
  - Validation constraints and business rules
- **Migration System**
  - Database migration scripts
  - Seed data for development
  - Schema versioning strategy

### 3. NestJS API Architecture

- **Module Structure**
  - Organizations module (tenant management)
  - Users module (authentication ready)
  - Wells module (CRUD operations)
  - Leases module (management)
  - Production module (data entry ready)
- **Core Services**
  - Database service with connection pooling
  - Validation service with Zod schemas
  - Audit logging service
  - Multi-tenant context service

### 4. API Foundation

- **RESTful Endpoints**
  - CRUD operations for all core entities
  - Proper HTTP status codes and error handling
  - Request/response validation with Zod
  - OpenAPI documentation generation
- **Middleware & Guards**
  - Request logging middleware
  - Validation pipes
  - Error handling filters
  - Rate limiting configuration

### 5. Background Job Processing

- **BullMQ Setup**
  - Redis connection configuration
  - Job queue definitions
  - Worker process setup
  - Job monitoring and retry logic
- **Initial Job Types**
  - Data validation jobs
  - Report generation preparation
  - Email notification framework

## Technical Requirements

### Database Schema

```typescript
// Core entities with proper relationships
Organizations -> Users (1:many)
Organizations -> Leases (1:many)
Organizations -> Wells (1:many)
Leases -> Wells (1:many)
Wells -> ProductionRecords (1:many)
Organizations -> Partners (1:many)
Leases -> LeasePartners (many:many through Partners)
```

### API Architecture

```typescript
// NestJS module structure
src/
├── organizations/    # Tenant management
├── users/           # User CRUD (auth in Sprint 3)
├── wells/           # Well management
├── leases/          # Lease management
├── production/      # Production data
├── partners/        # Partner management
├── common/          # Shared utilities
└── database/        # Drizzle configuration
```

### Performance Requirements

- API response time: < 200ms for CRUD operations
- Database query optimization with proper indexing
- Connection pooling for concurrent requests
- Efficient pagination for large datasets

## Acceptance Criteria

### Database Schema

- [ ] All tables created with proper constraints
- [ ] Foreign key relationships established
- [ ] Indexes created for performance-critical queries
- [ ] Row Level Security policies implemented
- [ ] TimescaleDB hypertable configured for production data
- [ ] Migration scripts run successfully
- [ ] Seed data populates development environment

### API Endpoints

- [ ] CRUD operations work for all core entities
- [ ] Request validation prevents invalid data
- [ ] Error responses follow consistent format
- [ ] API documentation generates automatically
- [ ] Multi-tenant isolation verified
- [ ] Rate limiting prevents abuse
- [ ] Audit logging captures all changes

### Data Validation

- [ ] API number format validation (14-digit)
- [ ] Production volume constraints (non-negative)
- [ ] Percentage validations for ownership interests
- [ ] Required field validation across all entities
- [ ] Business rule constraints enforced

### Background Jobs

- [ ] BullMQ queues process jobs successfully
- [ ] Job retry logic handles failures
- [ ] Job monitoring dashboard accessible
- [ ] Worker processes scale with load

## Team Assignments

### Backend Lead Developer

- Database schema design and implementation
- Drizzle ORM configuration and migrations
- Core API architecture and module structure
- Performance optimization and indexing

### Backend Developers (2)

- Individual module implementation (wells, leases, production)
- API endpoint development and validation
- Background job setup and configuration
- Unit test implementation

### DevOps Engineer

- Database deployment and configuration
- Redis setup for background jobs
- Performance monitoring setup
- Database backup and recovery procedures

## Dependencies

### From Previous Sprint

- ✅ Railway PostgreSQL database available
- ✅ Redis instance configured
- ✅ Development environment setup

### External Dependencies

- Drizzle ORM and Drizzle Kit
- BullMQ and Redis client libraries
- Zod validation library
- NestJS framework and decorators

## Database Design Validation

### Multi-Tenancy

```sql
-- Row Level Security example
CREATE POLICY tenant_isolation ON wells
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### Performance Optimization

```sql
-- Critical indexes for production queries
CREATE INDEX idx_production_records_well_date ON production_records(well_id, production_date);
CREATE INDEX idx_wells_organization ON wells(organization_id);
CREATE INDEX idx_api_number_lookup ON wells(api_number);
```

### Data Integrity

```sql
-- Business rule constraints
ALTER TABLE production_records ADD CONSTRAINT chk_positive_volumes
  CHECK (oil_volume >= 0 AND gas_volume >= 0 AND water_volume >= 0);

ALTER TABLE wells ADD CONSTRAINT chk_valid_api_number
  CHECK (LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$');
```

## Risks & Mitigation

### Technical Risks

- **Complex relationships**: Start with core entities, add complexity gradually
- **Performance issues**: Implement indexing strategy early
- **Multi-tenant complexity**: Test isolation thoroughly

### Data Risks

- **Migration failures**: Test migrations on staging data
- **Data corruption**: Implement comprehensive validation
- **Backup failures**: Test restore procedures

## Definition of Done

### Technical Completion

- [ ] All database tables created and tested
- [ ] API endpoints return correct data
- [ ] Multi-tenant isolation verified
- [ ] Background job processing functional
- [ ] Performance benchmarks meet requirements

### Code Quality

- [ ] Unit tests cover >80% of code
- [ ] Integration tests verify API functionality
- [ ] Code review completed by technical lead
- [ ] Documentation updated for all endpoints

### Security & Compliance

- [ ] Row Level Security policies active
- [ ] Audit logging captures all data changes
- [ ] Input validation prevents injection attacks
- [ ] Error messages don't leak sensitive data

## Success Metrics

- **API Performance**: < 200ms average response time
- **Database Performance**: < 50ms average query time
- **Test Coverage**: > 80% code coverage
- **Error Rate**: < 0.1% API error rate

## Next Sprint Preparation

- Authentication strategy implementation planning
- JWT token structure design
- Role-based access control specification
- Password security requirements review

---

**Sprint 2 creates the data foundation and API structure that all subsequent
features will build upon. Quality and performance here directly impact the
entire application.**
