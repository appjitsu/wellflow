# Sprint 2: Enhanced Database Schema & Core API Foundation

## Sprint Overview

**Duration:** 4 weeks **Story Points:** 18 points **Sprint Goal:** Implement
core database schema foundation, basic API architecture, and foundational
backend services for WellFlow MVP. Specialized entities will be implemented in
subsequent enhancement sprints (2B-2E).

## ⚠️ **SCOPE CLARIFICATION: Core Foundation Only**

This sprint focuses on the essential foundation entities required for basic
operations. Advanced operational, financial, regulatory, and technical entities
are implemented in specialized enhancement sprints to avoid overlap and ensure
focused development.

## Sprint Objectives

1. Implement complete database schema with Drizzle ORM
2. Build core NestJS API architecture with modules
3. Establish multi-tenant data isolation with RLS
4. Create foundational API endpoints and validation
5. Implement background job processing with BullMQ

## Deliverables

### 1. Enhanced Database Schema Implementation

#### **Phase 1: Core Business Entities (Week 1)**

- **Essential Core Tables**
  - `organizations` - Multi-tenant root entity
  - `users` - Role-based structure with basic permissions
  - `fields` - ⭐ NEW: Basic geological field grouping
  - `companies` - ⭐ NEW: Basic operator/partner/vendor management
  - `leases` - Basic lease information with legal descriptions
  - `wells` - Basic well information with API number validation

#### **Phase 2: Basic Financial & Production (Week 2)**

- **Basic Financial Systems**
  - `afes` - Authorization for Expenditures (basic structure)
  - `afe_line_items`, `afe_approvals` - Basic cost tracking
  - `division_orders` - Basic division order management
  - `revenue_distributions` - Basic revenue distribution tracking

#### **Phase 3: Basic Production & Compliance (Week 3)**

- **Basic Production Data**
  - `production` - Basic production data (oil, gas, water volumes)
  - `well_tests` - Basic well test data
- **Basic Regulatory Compliance**
  - `regulatory_reports` - Basic regulatory reporting structure
  - `compliance_schedules` - Basic compliance deadline tracking

#### **Phase 4: Core Infrastructure (Week 4)**

- **System Infrastructure**
  - Core API endpoints for all basic entities
  - Basic validation and business rules
  - Multi-tenant security implementation
  - Background job processing setup
- **Basic Enums**
  - Essential enums for well status, lease status, report types
  - Foundation for specialized enums in enhancement sprints

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

### Core Database Schema Relationships

```typescript
// Core Business Entity Relationships
Organizations -> Users (1:many)
Organizations -> Fields (1:many)
Organizations -> Companies (1:many)
Fields -> Leases (1:many)
Fields -> Wells (1:many)
Leases -> Wells (1:many)
Wells -> Production (1:many)

// Basic Financial Relationships
Organizations -> AFEs (1:many)
AFEs -> AFELineItems (1:many)
AFEs -> AFEApprovals (1:many)
Wells -> DivisionOrders (1:many)
Organizations -> RevenueDistributions (1:many)

// Basic Compliance Relationships
Organizations -> RegulatoryReports (1:many)
Organizations -> ComplianceSchedules (1:many)
Wells -> WellTests (1:many)

// Note: Advanced relationships for operational, financial,
// regulatory, and technical entities are implemented in
// enhancement sprints 2B-2E
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

### Enhanced Database Schema (40+ Tables)

#### **Phase 1: Core Business Entities**

- [ ] `fields` table with basin/play geological grouping
- [ ] Enhanced `companies` table with comprehensive operator data
- [ ] Enhanced `leases` table with working interest and NRI tracking
- [ ] Enhanced `wells` table with horizontal/offshore flags and rig associations
- [ ] All core foreign key relationships established

#### **Phase 2: Basic Financial & Production**

- [ ] Basic `afes` table with essential cost tracking
- [ ] `afe_line_items` and `afe_approvals` tables
- [ ] Basic `division_orders` table
- [ ] Basic `revenue_distributions` table

#### **Phase 3: Basic Production & Compliance**

- [ ] Basic `regulatory_reports` table
- [ ] Basic `compliance_schedules` table

#### **Phase 4: Core Infrastructure**

- [ ] Core API endpoints for all basic entities
- [ ] Multi-tenant security implementation
- [ ] Background job processing setup
- [ ] Basic `production` table with essential volume data
- [ ] Basic `well_tests` table with test results
- [ ] Essential enums implemented for core operations

#### **Infrastructure Requirements**

- [ ] Core 15+ tables created with proper constraints
- [ ] Essential foreign key relationships established
- [ ] Performance indexes for critical query paths
- [ ] Row Level Security policies for all tables
- [ ] TimescaleDB hypertables for time-series data
- [ ] Migration scripts handle schema changes
- [ ] Basic seed data for development/testing

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

## Enhanced Team Assignments

### Backend Lead Developer (40 hours/week)

- **Week 1**: Core business entities schema design (fields, companies, enhanced
  leases/wells)
- **Week 2**: Operational entities implementation (rigs, drilling programs,
  facilities)
- **Week 3**: Financial systems architecture (JIB, working interests, JOAs)
- **Week 4**: Regulatory and technical data systems (permits, HSE, geological
  data)
- Complex relationship mapping and performance optimization

### Senior Backend Developer (40 hours/week)

- **Week 1**: Enhanced enum systems and validation logic
- **Week 2**: Drilling and operational API endpoints
- **Week 3**: Financial calculation engines and payment processing
- **Week 4**: Regulatory reporting and compliance systems
- Advanced business logic implementation

### Backend Developer (40 hours/week)

- **Week 1**: Core CRUD operations and basic API endpoints
- **Week 2**: Operational data entry and validation systems
- **Week 3**: Financial data processing and reporting
- **Week 4**: Technical data management and reserves calculations
- Unit testing and integration testing

### Database Specialist (20 hours/week)

- **Weeks 1-4**: Complex migration scripts for 40+ table schema
- Performance indexing strategy for large datasets
- TimescaleDB optimization for production data
- Row Level Security implementation across all entities

### DevOps Engineer (20 hours/week)

- Enhanced database deployment with complex schema
- Redis setup for background job processing
- Performance monitoring for 40+ table queries
- Backup and recovery procedures for complex relationships

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

## Enhanced Success Metrics

### **Schema Completeness**

- **Foundation Coverage**: Core entities for basic upstream operations
- **Table Implementation**: 15+ essential tables successfully deployed
- **Relationship Integrity**: 100% foreign key constraints validated
- **Enum Coverage**: Essential enums for core business operations

### **Performance Benchmarks**

- **API Performance**: < 200ms average response time (complex queries < 500ms)
- **Database Performance**: < 50ms average query time (< 100ms for complex
  joins)
- **Migration Performance**: < 5 minutes for full schema deployment
- **Index Effectiveness**: > 95% query performance improvement with indexes

### **Quality Metrics**

- **Test Coverage**: > 80% code coverage across all modules
- **Error Rate**: < 0.1% API error rate
- **Data Integrity**: 100% constraint validation success
- **Security Compliance**: 100% RLS policy coverage

## Schema Enhancement Impact

### **Business Value Delivered**

- **Financial Control**: Complete AFE, JIB, and revenue distribution systems
- **Regulatory Compliance**: Comprehensive permit and HSE incident tracking
- **Operational Excellence**: Drilling programs and daily reporting capabilities
- **Stakeholder Management**: Working interest and royalty owner systems

### **Technical Foundation**

- **Enterprise Architecture**: Industry-standard data model
- **Scalability**: Optimized for 10,000+ wells per organization
- **Integration Ready**: Schema supports major industry software integrations
- **Compliance Ready**: SEC, EPA, and state regulatory reporting capabilities

## Next Sprint Preparation

- Enhanced authentication with role-based permissions for 40+ entities
- JWT token structure with granular access control
- Multi-tenant security across complex entity relationships
- Advanced audit logging for financial and regulatory compliance

---

**This enhanced Sprint 2 transforms WellFlow from a basic well tracking system
to a comprehensive upstream operations platform, establishing the
enterprise-grade foundation required for industry leadership.**
