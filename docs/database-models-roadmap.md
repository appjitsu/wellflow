# WellFlow Database Models Roadmap

## Overview

This document outlines the complete database model roadmap for WellFlow,
including the core MVP models (implemented in Sprint 2) and additional
enhancement models planned for future sprints.

## ✅ Core MVP Models (Sprint 2 - IMPLEMENTED)

### Multi-Tenant Foundation

- **`organizations`** - Multi-tenant root entity for oil & gas operators
- **`users`** - RBAC system (owner/manager/pumper roles)

### Asset Management

- **`leases`** - Legal agreements for oil & gas extraction rights
- **`wells`** - Individual wellbores with API numbers and locations
- **`equipment`** - Well equipment inventory and management

### Production & Operations

- **`production_records`** - Daily production data (TimescaleDB optimized)
- **`well_tests`** - Periodic well performance testing

### Financial & Partnership

- **`partners`** - Joint venture partners and royalty owners
- **`lease_partners`** - Partnership relationships with percentages
- **`jib_statements`** - Joint Interest Billing statements

### Compliance & Documentation

- **`compliance_reports`** - Regulatory reporting framework
- **`documents`** - Centralized document storage and management

**Total MVP Models: 12 tables**

## 🔄 Enhancement Models (Future Sprints)

### Sprint 6: Production Data Backend & API

**Focus**: Operational tracking and system monitoring

#### Operational Models

- **`maintenance_records`** - Equipment maintenance history and scheduling
  - Preventive, corrective, and emergency maintenance tracking
  - Cost tracking and parts inventory
  - Next maintenance date scheduling

- **`incidents`** - Safety incidents, spills, regulatory violations
  - Incident classification and severity tracking
  - Regulatory notification requirements
  - Resolution tracking and audit trail

- **`alerts`** - System notifications and operational alerts
  - Production, equipment, compliance, and financial alerts
  - Priority levels and resolution tracking
  - User notification preferences

### Sprint 9: Regulatory Compliance Framework

**Focus**: Regulatory and tax management

#### Regulatory Models

- **`permits`** - Drilling permits, environmental permits, regulatory approvals
  - Multi-jurisdiction permit tracking
  - Expiration and renewal management
  - Compliance condition monitoring

- **`tax_records`** - Severance tax, depletion tracking, tax calculations
  - Multi-state tax calculation support
  - Deduction and depletion tracking
  - Filing status and payment tracking

### Sprint 11: Partner Management & Basic JIB

**Focus**: Financial management and accounting

#### Financial Models

- **`expenses`** - Operating expenses (LOE) and capital expenses tracking
  - Expense categorization and allocation
  - Approval workflows and vendor management
  - Cost center and well-level tracking

- **`revenue_distributions`** - Partner revenue calculations and distributions
  - Working interest and royalty calculations
  - Distribution period tracking
  - Payment status and audit trail

- **`bank_accounts`** - Financial account management
  - Organization and partner banking information
  - Primary account designation
  - Encrypted account number storage

### Sprint 12: JIB Calculations & Statement Generation

**Focus**: Advanced analytics and contract management

#### Analytics Models

- **`forecasts`** - Production forecasting data and predictions
  - Multiple forecasting methods support
  - Confidence intervals and validation
  - Decline curve and type curve analysis

- **`benchmarks`** - Industry benchmarking data and comparisons
  - Regional and formation-specific benchmarks
  - Performance percentile tracking
  - Industry average comparisons

- **`contracts`** - Service contracts, vendor agreements, operating agreements
  - Contract lifecycle management
  - Auto-renewal and termination tracking
  - Key terms and payment management

## Implementation Strategy

### Phase 1: MVP Foundation (Sprint 2) ✅

- **Status**: COMPLETE
- **Models**: 12 core tables
- **Focus**: Essential business operations

### Phase 2: Operational Enhancement (Sprint 6)

- **Models**: 3 additional tables
- **Focus**: Maintenance, incidents, alerts
- **Dependencies**: Core production and equipment models

### Phase 3: Regulatory Enhancement (Sprint 9)

- **Models**: 2 additional tables
- **Focus**: Permits and tax management
- **Dependencies**: Compliance framework

### Phase 4: Financial Enhancement (Sprint 11)

- **Models**: 3 additional tables
- **Focus**: Advanced financial tracking
- **Dependencies**: Partner management system

### Phase 5: Analytics Enhancement (Sprint 12)

- **Models**: 3 additional tables
- **Focus**: Forecasting and contract management
- **Dependencies**: Complete financial system

## Total Database Architecture

### Final Model Count

- **MVP Models**: 12 tables
- **Enhancement Models**: 11 tables
- **Total Models**: 23 tables

### Database Design Principles

- **Multi-tenant isolation** via organization_id foreign keys
- **UUID primary keys** for distributed system compatibility
- **JSONB fields** for flexible metadata storage
- **Audit trails** with created/updated timestamps
- **Performance optimization** with strategic indexing
- **Row Level Security (RLS)** ready for PostgreSQL

### Technology Stack

- **Database**: PostgreSQL 14+ with TimescaleDB extension
- **ORM**: Drizzle ORM with TypeScript
- **Migrations**: Drizzle Kit for schema management
- **Caching**: Redis for frequently accessed data
- **File Storage**: UploadThing for documents

## Migration Strategy

### Backward Compatibility

- All enhancement models are additive (no breaking changes)
- Existing APIs remain functional during model additions
- Optional foreign key relationships to new models

### Deployment Approach

- **Blue-green deployment** for production updates
- **Feature flags** for gradual model rollout
- **Data validation** before enabling new features

### Performance Considerations

- **Incremental indexing** as models are added
- **Query optimization** for new relationships
- **Caching strategy** updates for new data patterns

---

**This roadmap ensures WellFlow's database architecture scales efficiently from
MVP to enterprise-grade oil & gas management platform.**
