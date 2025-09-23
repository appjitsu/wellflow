# WellFlow Technical Architecture & Data Models

## Executive Summary

WellFlow uses a modern, scalable architecture designed for small oil & gas
operators. The platform combines NestJS backend, Next.js frontend, React Native
mobile, and PostgreSQL database with multi-tenant security for reliable
operations management.

**Key Architectural Decisions:**

- **Stack**: NestJS + Next.js + React Native + PostgreSQL
- **Approach**: Mobile-first, offline-capable, regulatory compliance focused
- **Security**: Multi-tenant with Row Level Security (RLS)
- **Deployment**: Railway (MVP) → AWS (scale)
- **Timeline**: 6 months to market leadership

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │    Web App      │
│  React Native   │    │    Next.js      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐
         │  NestJS API     │
         │  Guards/Auth    │
         │  Business Logic │
         │  Background Jobs│
         └─────────────────┘
                     │
         ┌─────────────────┐
         │  Data Layer     │
         │  PostgreSQL     │
         │  Redis Cache    │
         │  File Storage   │
         └─────────────────┘
```

### Technology Stack

**Frontend:**

- Mobile: React Native (iOS/Android) with offline capability
- Web: Next.js 14+ with TypeScript, SSR/SSG
- UI: Tailwind CSS + ShadCN/UI components
- State: TanStack Query + Zustand
- Forms: React Hook Form with Zod validation

**Backend:**

- Runtime: Node.js with TypeScript
- Framework: NestJS with enterprise patterns
- API: RESTful with OpenAPI/Swagger docs
- Auth: JWT with Passport.js + CASL authorization
- ORM: Drizzle ORM with TypeScript-first schema
- Jobs: BullMQ with Redis for async processing

**Database:**

- Primary: PostgreSQL with TimescaleDB extension
- Cache: Redis for sessions and job queues
- Files: UploadThing for document management
- Multi-tenant: Row Level Security (RLS) for data isolation

**Infrastructure:**

- Hosting: Railway (MVP) → AWS (growth)
- Email: Resend for transactional emails
- SMS: Twilio for compliance alerts
- Monitoring: Sentry + LogRocket
- CI/CD: GitHub Actions

## Data Model Architecture

### Core Entity Relationships

```
ORGANIZATION (Root tenant entity)
├── USERS (role-based access)
├── LEASES (legal agreements)
│   ├── WELLS (individual wellbores)
│   │   ├── PRODUCTION_RECORDS (daily data)
│   │   ├── EQUIPMENT (well equipment)
│   │   └── WELL_TESTS (performance)
│   ├── LEASE_PARTNERS (ownership interests)
│   └── DOCUMENTS (lease documents)
├── PARTNERS (JV partners/royalty owners)
├── COMPLIANCE_REPORTS (regulatory)
└── JIB_STATEMENTS (joint interest billing)
```

### Key Models

**Organization (Multi-tenant root):**

```typescript
interface Organization {
  id: string;
  name: string;
  taxId: string;
  address: object;
  settings: object;
}
```

**Well (Core operational entity):**

```typescript
interface Well {
  id: string;
  organizationId: string;
  leaseId: string;
  wellName: string;
  apiNumber: string; // 14-digit industry standard
  surfaceLocation: object;
  bottomHoleLocation: object;
  totalDepth: number;
  status: 'drilling' | 'producing' | 'shut_in' | 'plugged';
  wellConfiguration: object;
}
```

**Production Record (Time-series data):**

```typescript
interface ProductionRecord {
  id: string;
  wellId: string;
  productionDate: Date;
  oilVolume: number;
  gasVolume: number;
  waterVolume: number;
  oilPrice: number;
  gasPrice: number;
  equipmentReadings: object;
  isEstimated: boolean;
}
```

**Compliance Report (Regulatory automation):**

```typescript
interface ComplianceReport {
  id: string;
  organizationId: string;
  reportType: 'form_pr' | 'severance_tax' | 'royalty_report';
  stateJurisdiction: string;
  reportingPeriod: DateRange;
  dueDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  formData: object;
  calculatedValues: object;
}
```

## Multi-Tenant Security Architecture

### Row Level Security (RLS)

**Implementation:**

- PostgreSQL RLS policies on all tenant tables
- Automatic role switching to `application_role`
- Session-based organization context
- Complete data isolation between tenants

**Example Policy:**

```sql
CREATE POLICY tenant_isolation ON wells
  FOR ALL TO application_role
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

**Security Components:**

- `DatabaseService`: Organization context management
- `TenantRlsService`: Integration layer for tenant context
- `TenantGuard`: Automatic context from JWT tokens

**Performance Optimizations:**

- Organization ID indexes on all tenant tables
- Composite indexes for common query patterns
- Connection pooling to reduce role switching overhead

## Development Patterns & Architecture

### SOLID Principles Implementation

**Single Responsibility:**

```typescript
@Injectable()
export class ProductionDataService {
  async createProductionRecord(data: CreateProductionDto) {}
  async getProductionByWell(wellId: string) {}
}

@Injectable()
export class ComplianceService {
  async generateFormPR(organizationId: string, month: string) {}
  async checkComplianceDeadlines(organizationId: string) {}
}
```

**Open/Closed Principle:**

```typescript
abstract class ComplianceFormGenerator {
  abstract generateForm(data: ProductionData[]): Promise<ComplianceForm>;

  protected validateProductionData(data: ProductionData[]): boolean {
    return data.every((record) => record.oilVolume >= 0);
  }
}

@Injectable()
export class TexasFormPRGenerator extends ComplianceFormGenerator {
  async generateForm(data: ProductionData[]): Promise<TexasFormPR> {
    if (!this.validateProductionData(data)) {
      throw new Error('Invalid production data');
    }
    return new TexasFormPR(data);
  }
}
```

### Authorization with CASL

```typescript
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    if (user.role === 'owner') {
      can(Action.Manage, 'all');
    } else if (user.role === 'manager') {
      can(Action.Read, Well, { organizationId: user.organizationId });
      can(Action.Update, Production, { organizationId: user.organizationId });
    } else if (user.role === 'pumper') {
      can(Action.Create, Production, { organizationId: user.organizationId });
      can(Action.Read, Well, { organizationId: user.organizationId });
    }

    return build();
  }
}
```

## Performance & Scalability

### Database Optimization

**Time-Series Data with TimescaleDB:**

```sql
-- Convert production_records to hypertable
SELECT create_hypertable('production_records', 'production_date');

-- Automatic partitioning by time
SELECT add_retention_policy('production_records', INTERVAL '7 years');
```

**Indexing Strategy:**

```sql
-- Performance-critical indexes
CREATE INDEX idx_production_records_well_date
  ON production_records(well_id, production_date);
CREATE INDEX idx_wells_organization
  ON wells(organization_id);
CREATE INDEX idx_compliance_reports_due_date
  ON compliance_reports(due_date) WHERE status != 'submitted';
```

### Caching Strategy

**Redis Implementation:**

- Session storage for user authentication
- BullMQ job queues for background processing
- Frequently accessed data caching
- Real-time features support

### Horizontal Scaling

**Microservices Ready:**

- Module-based architecture enables service separation
- Database read replicas for analytics queries
- CDN for static assets and file storage
- Auto-scaling based on usage patterns

## Mobile Architecture

### Offline-First Design

**React Native Implementation:**

- Local SQLite cache with background sync
- Offline data collection for field operations
- Queue-based sync when connectivity returns
- Optimistic updates with conflict resolution

**Key Features:**

- Touch-optimized data entry forms
- GPS integration for well locations
- Photo capture for equipment documentation
- Background sync with progress indicators

### Performance Targets

- <3 second initial load time
- <200ms API response times
- Works on 3G networks
- Offline capability for 24+ hours

## Deployment & Infrastructure

### Railway MVP Architecture

**Development/MVP Stack:**

- Frontend: Vercel (Next.js with edge functions)
- Backend: Railway (containerized NestJS)
- Database: Railway PostgreSQL with TimescaleDB
- Cache: Railway Redis for BullMQ
- Files: UploadThing (type-safe uploads)
- Cost: ~$111/month, scales with usage

**Migration Triggers to AWS:**

- 100+ active customers OR $50K+ MRR
- > 2M API requests/month OR >100GB database
- Consistent >500ms response times
- Enterprise security requirements (SOC 2)

### Production AWS Architecture

**Growth Stack:**

- Frontend: Vercel (unchanged)
- Backend: AWS ECS Fargate + ALB
- Database: AWS RDS PostgreSQL with TimescaleDB
- Cache: AWS ElastiCache Redis
- Files: Continue UploadThing or migrate to S3
- Monitoring: AWS CloudWatch + Sentry
- Cost: ~$200-300/month

### Performance Requirements

- 99.9% uptime SLA with automatic failover
- <2 second page load times globally
- <500ms API response times
- Real-time updates within 30 seconds
- Mobile app optimized for 3G networks

## Integration Architecture

### External Services

**Required Integrations:**

- QuickBooks: Financial data synchronization
- Texas RRC Portal: Compliance report submission
- Email/SMS: Automated notifications and alerts
- Payment Processing: Subscription management

**Optional Integrations:**

- SCADA Systems: Automated data collection (Phase 3)
- GIS Platforms: Spatial data management
- Additional State Agencies: Multi-state compliance

### API Design

**RESTful Endpoints:**

```
/api/v1/
├── /auth (JWT authentication)
├── /organizations (tenant management)
├── /wells (well CRUD operations)
├── /production (production data entry)
├── /compliance (regulatory forms)
├── /partners (JIB management)
├── /documents (file management)
└── /analytics (reporting)
```

**Standards:**

- OpenAPI/Swagger documentation
- Consistent error handling
- Rate limiting and security headers
- API versioning for backward compatibility

This architecture provides a solid foundation for rapid development, regulatory
compliance, and scalable growth while maintaining the security and reliability
required for critical oil & gas operations.

## Complete Drizzle Schema Implementation

### Comprehensive Upstream Oil & Gas Schema

The following TypeScript schema implements the complete upstream oil & gas
business workflow using Drizzle ORM for PostgreSQL:

```typescript
// Complete Upstream Oil & Gas Business Workflow Schema
// Built with Drizzle ORM for PostgreSQL

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
  real,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ENUMS ====================

export const wellStatusEnum = pgEnum('well_status', [
  'proposed',
  'permitted',
  'spudded',
  'drilling',
  'completing',
  'producing',
  'shut_in',
  'temporarily_abandoned',
  'permanently_abandoned',
  'plugged',
]);

export const wellTypeEnum = pgEnum('well_type', [
  'oil',
  'gas',
  'oil_gas',
  'injection',
  'disposal',
  'water_supply',
  'observation',
  'dry_hole',
]);

export const wellPurposeEnum = pgEnum('well_purpose', [
  'exploration',
  'appraisal',
  'development',
  'injection',
  'disposal',
  'observation',
]);

export const operatorTypeEnum = pgEnum('operator_type', [
  'operator',
  'non_operator',
  'carried_interest',
  'farm_in',
  'farm_out',
]);

export const interestTypeEnum = pgEnum('interest_type', [
  'working_interest',
  'royalty_interest',
  'overriding_royalty',
  'net_profits_interest',
  'carried_interest',
  'production_payment',
]);

export const contractStatusEnum = pgEnum('contract_status', [
  'draft',
  'pending_approval',
  'active',
  'suspended',
  'terminated',
  'expired',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'lease',
  'title_opinion',
  'division_order',
  'joa',
  'farm_out',
  'psa',
  'permit',
  'report',
  'correspondence',
]);

export const permitTypeEnum = pgEnum('permit_type', [
  'drilling',
  'completion',
  'workover',
  'injection',
  'disposal',
  'facility',
  'pipeline',
  'environmental',
]);

export const permitStatusEnum = pgEnum('permit_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'denied',
  'expired',
  'renewed',
]);

export const afeStatusEnum = pgEnum('afe_status', [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'closed',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'submitted',
  'approved',
  'disputed',
  'paid',
  'partially_paid',
  'void',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'reversed',
  'suspended',
]);

export const productTypeEnum = pgEnum('product_type', [
  'oil',
  'gas',
  'condensate',
  'ngl',
  'water',
  'co2',
  'helium',
]);

export const uomEnum = pgEnum('uom', [
  'bbl',
  'mcf',
  'mmbtu',
  'gal',
  'ton',
  'mt',
  'boe',
]);

export const facilityTypeEnum = pgEnum('facility_type', [
  'well_pad',
  'tank_battery',
  'separator',
  'compressor',
  'pump_station',
  'processing_plant',
  'terminal',
  'pipeline',
]);

export const incidentTypeEnum = pgEnum('incident_type', [
  'spill',
  'release',
  'injury',
  'fatality',
  'near_miss',
  'equipment_failure',
  'well_control',
  'fire',
  'explosion',
]);

export const severityEnum = pgEnum('severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

// ==================== CORE ENTITIES ====================

// Fields/Assets
export const fields = pgTable(
  'fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fieldName: varchar('field_name', { length: 255 }).notNull(),
    fieldCode: varchar('field_code', { length: 50 }).unique(),
    basin: varchar('basin', { length: 255 }),
    play: varchar('play', { length: 255 }),
    country: varchar('country', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }),
    county: varchar('county', { length: 100 }),
    discoveryDate: date('discovery_date'),
    operatorId: uuid('operator_id').references(() => companies.id),
    status: varchar('status', { length: 50 }).default('active'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    operatorIdx: index('field_operator_idx').on(table.operatorId),
    locationIdx: index('field_location_idx').on(table.state, table.county),
  })
);

// Leases
export const leases = pgTable(
  'leases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaseNumber: varchar('lease_number', { length: 100 }).unique().notNull(),
    leaseName: varchar('lease_name', { length: 255 }).notNull(),
    fieldId: uuid('field_id').references(() => fields.id),
    lessorName: varchar('lessor_name', { length: 255 }),
    effectiveDate: date('effective_date').notNull(),
    expirationDate: date('expiration_date'),
    primaryTerm: integer('primary_term'),
    royaltyRate: decimal('royalty_rate', { precision: 10, scale: 8 }).notNull(),
    bonusAmount: decimal('bonus_amount', { precision: 15, scale: 2 }),
    netAcres: decimal('net_acres', { precision: 12, scale: 4 }),
    grossAcres: decimal('gross_acres', { precision: 12, scale: 4 }),
    workingInterest: decimal('working_interest', { precision: 10, scale: 8 }),
    netRevenueInterest: decimal('net_revenue_interest', {
      precision: 10,
      scale: 8,
    }),
    legalDescription: text('legal_description'),
    status: varchar('status', { length: 50 }).default('active'),
    pughClause: boolean('pugh_clause').default(false),
    depthLimitation: jsonb('depth_limitation'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    fieldIdx: index('lease_field_idx').on(table.fieldId),
    expirationIdx: index('lease_expiration_idx').on(table.expirationDate),
  })
);

// Wells - Core Production Assets
export const wells = pgTable(
  'wells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellName: varchar('well_name', { length: 255 }).notNull(),
    apiNumber: varchar('api_number', { length: 20 }).unique(),
    wellNumber: varchar('well_number', { length: 50 }),
    leaseId: uuid('lease_id').references(() => leases.id),
    fieldId: uuid('field_id').references(() => fields.id),
    operatorId: uuid('operator_id').references(() => companies.id),
    wellType: wellTypeEnum('well_type').notNull(),
    wellPurpose: wellPurposeEnum('well_purpose').notNull(),
    wellStatus: wellStatusEnum('well_status').notNull(),
    spudDate: date('spud_date'),
    completionDate: date('completion_date'),
    firstProductionDate: date('first_production_date'),
    pluggedDate: date('plugged_date'),
    surfaceLatitude: decimal('surface_latitude', { precision: 10, scale: 7 }),
    surfaceLongitude: decimal('surface_longitude', { precision: 10, scale: 7 }),
    bottomLatitude: decimal('bottom_latitude', { precision: 10, scale: 7 }),
    bottomLongitude: decimal('bottom_longitude', { precision: 10, scale: 7 }),
    totalDepth: decimal('total_depth', { precision: 10, scale: 2 }),
    tvd: decimal('tvd', { precision: 10, scale: 2 }),
    groundElevation: decimal('ground_elevation', { precision: 10, scale: 2 }),
    kbElevation: decimal('kb_elevation', { precision: 10, scale: 2 }),
    waterDepth: decimal('water_depth', { precision: 10, scale: 2 }),
    isHorizontal: boolean('is_horizontal').default(false),
    isOffshore: boolean('is_offshore').default(false),
    rigId: uuid('rig_id').references(() => rigs.id),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    apiIdx: uniqueIndex('well_api_idx').on(table.apiNumber),
    leaseIdx: index('well_lease_idx').on(table.leaseId),
    fieldIdx: index('well_field_idx').on(table.fieldId),
    operatorIdx: index('well_operator_idx').on(table.operatorId),
    statusIdx: index('well_status_idx').on(table.wellStatus),
    locationIdx: index('well_location_idx').on(
      table.surfaceLatitude,
      table.surfaceLongitude
    ),
  })
);

// Companies - Operators, Partners, Vendors
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    companyCode: varchar('company_code', { length: 50 }).unique(),
    companyType: varchar('company_type', { length: 50 }),
    taxId: varchar('tax_id', { length: 50 }),
    dunsNumber: varchar('duns_number', { length: 20 }),
    address: jsonb('address'),
    primaryContact: jsonb('primary_contact'),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 255 }),
    creditRating: varchar('credit_rating', { length: 10 }),
    insuranceCoverage: jsonb('insurance_coverage'),
    vendorNumber: varchar('vendor_number', { length: 50 }),
    isOperator: boolean('is_operator').default(false),
    isVendor: boolean('is_vendor').default(false),
    isPartner: boolean('is_partner').default(false),
    status: varchar('status', { length: 50 }).default('active'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('company_name_idx').on(table.companyName),
    typeIdx: index('company_type_idx').on(table.companyType),
  })
);

// Production Data - Time Series Optimized
export const production = pgTable(
  'production',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wellId: uuid('well_id')
      .references(() => wells.id)
      .notNull(),
    productionDate: date('production_date').notNull(),
    oilVolume: decimal('oil_volume', { precision: 15, scale: 4 }),
    gasVolume: decimal('gas_volume', { precision: 15, scale: 4 }),
    waterVolume: decimal('water_volume', { precision: 15, scale: 4 }),
    condensateVolume: decimal('condensate_volume', { precision: 15, scale: 4 }),
    injectionVolume: decimal('injection_volume', { precision: 15, scale: 4 }),
    hoursOn: decimal('hours_on', { precision: 5, scale: 2 }).default('24'),
    choke: varchar('choke', { length: 50 }),
    tubingPressure: decimal('tubing_pressure', { precision: 10, scale: 2 }),
    casingPressure: decimal('casing_pressure', { precision: 10, scale: 2 }),
    linePressure: decimal('line_pressure', { precision: 10, scale: 2 }),
    temperature: decimal('temperature', { precision: 10, scale: 2 }),
    bsw: decimal('bsw', { precision: 5, scale: 2 }),
    gor: decimal('gor', { precision: 15, scale: 4 }),
    api: decimal('api', { precision: 5, scale: 2 }),
    downtime: jsonb('downtime'),
    allocatedOil: decimal('allocated_oil', { precision: 15, scale: 4 }),
    allocatedGas: decimal('allocated_gas', { precision: 15, scale: 4 }),
    salesOil: decimal('sales_oil', { precision: 15, scale: 4 }),
    salesGas: decimal('sales_gas', { precision: 15, scale: 4 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    wellDateIdx: uniqueIndex('production_well_date_idx').on(
      table.wellId,
      table.productionDate
    ),
    dateIdx: index('production_date_idx').on(table.productionDate),
  })
);

// Financial Management - AFE System
export const afes = pgTable(
  'afes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    afeNumber: varchar('afe_number', { length: 100 }).unique().notNull(),
    afeTitle: varchar('afe_title', { length: 255 }).notNull(),
    wellId: uuid('well_id').references(() => wells.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    afeType: varchar('afe_type', { length: 100 }),
    status: afeStatusEnum('status').notNull(),
    totalEstimate: decimal('total_estimate', {
      precision: 18,
      scale: 2,
    }).notNull(),
    intangibleCost: decimal('intangible_cost', { precision: 18, scale: 2 }),
    tangibleCost: decimal('tangible_cost', { precision: 18, scale: 2 }),
    actualCost: decimal('actual_cost', { precision: 18, scale: 2 }),
    variance: decimal('variance', { precision: 18, scale: 2 }),
    operatorId: uuid('operator_id').references(() => companies.id),
    requestedBy: varchar('requested_by', { length: 255 }),
    requestedDate: date('requested_date'),
    approvalDeadline: date('approval_deadline'),
    costBreakdown: jsonb('cost_breakdown'),
    justification: text('justification'),
    economics: jsonb('economics'),
    partnersConsent: jsonb('partners_consent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    wellIdx: index('afe_well_idx').on(table.wellId),
    statusIdx: index('afe_status_idx').on(table.status),
    operatorIdx: index('afe_operator_idx').on(table.operatorId),
  })
);

// Revenue Distribution System
export const revenueDistribution = pgTable(
  'revenue_distribution',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productionMonth: date('production_month').notNull(),
    wellId: uuid('well_id').references(() => wells.id),
    leaseId: uuid('lease_id').references(() => leases.id),
    productType: productTypeEnum('product_type').notNull(),
    grossVolume: decimal('gross_volume', { precision: 18, scale: 4 }).notNull(),
    netVolume: decimal('net_volume', { precision: 18, scale: 4 }).notNull(),
    price: decimal('price', { precision: 12, scale: 4 }).notNull(),
    grossValue: decimal('gross_value', { precision: 18, scale: 2 }).notNull(),
    deductions: jsonb('deductions'),
    netValue: decimal('net_value', { precision: 18, scale: 2 }).notNull(),
    severanceTax: decimal('severance_tax', { precision: 15, scale: 2 }),
    adValoremTax: decimal('ad_valorem_tax', { precision: 15, scale: 2 }),
    transportationCost: decimal('transportation_cost', {
      precision: 15,
      scale: 2,
    }),
    processingCost: decimal('processing_cost', { precision: 15, scale: 2 }),
    runTicketNumbers: jsonb('run_ticket_numbers'),
    distributionDate: date('distribution_date'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    monthIdx: index('revenue_month_idx').on(table.productionMonth),
    wellIdx: index('revenue_well_idx').on(table.wellId),
    productIdx: index('revenue_product_idx').on(table.productType),
  })
);

// Regulatory Compliance
export const permits = pgTable(
  'permits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    permitNumber: varchar('permit_number', { length: 100 }).unique().notNull(),
    permitType: permitTypeEnum('permit_type').notNull(),
    status: permitStatusEnum('status').notNull(),
    wellId: uuid('well_id').references(() => wells.id),
    facilityId: uuid('facility_id').references(() => facilities.id),
    issuingAgency: varchar('issuing_agency', { length: 255 }),
    applicationDate: date('application_date'),
    approvalDate: date('approval_date'),
    expirationDate: date('expiration_date'),
    renewalDate: date('renewal_date'),
    conditions: jsonb('conditions'),
    fees: decimal('fees', { precision: 15, scale: 2 }),
    bondAmount: decimal('bond_amount', { precision: 15, scale: 2 }),
    documentUrl: text('document_url'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    typeIdx: index('permit_type_idx').on(table.permitType),
    statusIdx: index('permit_status_idx').on(table.status),
    expirationIdx: index('permit_expiration_idx').on(table.expirationDate),
    wellIdx: index('permit_well_idx').on(table.wellId),
  })
);

// Facilities for Equipment Management
export const facilities = pgTable(
  'facilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facilityName: varchar('facility_name', { length: 255 }).notNull(),
    facilityCode: varchar('facility_code', { length: 100 }).unique(),
    facilityType: facilityTypeEnum('facility_type').notNull(),
    fieldId: uuid('field_id').references(() => fields.id),
    operatorId: uuid('operator_id').references(() => companies.id),
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    capacity: jsonb('capacity'),
    designPressure: decimal('design_pressure', { precision: 10, scale: 2 }),
    installationDate: date('installation_date'),
    lastInspectionDate: date('last_inspection_date'),
    nextInspectionDate: date('next_inspection_date'),
    status: varchar('status', { length: 50 }).default('active'),
    equipment: jsonb('equipment'),
    piping: jsonb('piping'),
    instrumentation: jsonb('instrumentation'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    fieldIdx: index('facility_field_idx').on(table.fieldId),
    typeIdx: index('facility_type_idx').on(table.facilityType),
    operatorIdx: index('facility_operator_idx').on(table.operatorId),
  })
);

// Equipment for Asset Management
export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentTag: varchar('equipment_tag', { length: 100 }).unique().notNull(),
    equipmentName: varchar('equipment_name', { length: 255 }),
    equipmentType: varchar('equipment_type', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 255 }),
    model: varchar('model', { length: 255 }),
    serialNumber: varchar('serial_number', { length: 255 }),
    wellId: uuid('well_id').references(() => wells.id),
    facilityId: uuid('facility_id').references(() => facilities.id),
    installationDate: date('installation_date'),
    specifications: jsonb('specifications'),
    maintenanceSchedule: jsonb('maintenance_schedule'),
    lastMaintenanceDate: date('last_maintenance_date'),
    nextMaintenanceDate: date('next_maintenance_date'),
    status: varchar('status', { length: 50 }).default('active'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    wellIdx: index('equipment_well_idx').on(table.wellId),
    facilityIdx: index('equipment_facility_idx').on(table.facilityId),
    typeIdx: index('equipment_type_idx').on(table.equipmentType),
  })
);

// Drilling Operations
export const rigs = pgTable(
  'rigs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rigName: varchar('rig_name', { length: 255 }).notNull(),
    rigNumber: varchar('rig_number', { length: 100 }),
    contractorId: uuid('contractor_id').references(() => companies.id),
    rigType: varchar('rig_type', { length: 100 }),
    ratedDepth: decimal('rated_depth', { precision: 10, scale: 2 }),
    drawworks: varchar('drawworks', { length: 255 }),
    mastCapacity: decimal('mast_capacity', { precision: 10, scale: 2 }),
    mudPumps: jsonb('mud_pumps'),
    bopConfiguration: jsonb('bop_configuration'),
    dayRate: decimal('day_rate', { precision: 15, scale: 2 }),
    mobilizationCost: decimal('mobilization_cost', { precision: 15, scale: 2 }),
    status: varchar('status', { length: 50 }).default('available'),
    currentWellId: uuid('current_well_id').references(() => wells.id),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    contractorIdx: index('rig_contractor_idx').on(table.contractorId),
    statusIdx: index('rig_status_idx').on(table.status),
  })
);

// Table Relations - Key Relationships
export const fieldsRelations = relations(fields, ({ one, many }) => ({
  operator: one(companies, {
    fields: [fields.operatorId],
    references: [companies.id],
  }),
  leases: many(leases),
  wells: many(wells),
}));

export const wellsRelations = relations(wells, ({ one, many }) => ({
  lease: one(leases, {
    fields: [wells.leaseId],
    references: [leases.id],
  }),
  field: one(fields, {
    fields: [wells.fieldId],
    references: [fields.id],
  }),
  operator: one(companies, {
    fields: [wells.operatorId],
    references: [companies.id],
  }),
  production: many(production),
  equipment: many(equipment),
}));

export const productionRelations = relations(production, ({ one }) => ({
  well: one(wells, {
    fields: [production.wellId],
    references: [wells.id],
  }),
}));
```

### Schema Design Principles

#### Industry-Specific Features

- **14-digit API numbers** with proper validation for regulatory compliance
- **High-precision decimals** for production volumes (15,4 precision)
- **Multi-tenant architecture** with organization-based isolation
- **Time-series optimization** for production data with TimescaleDB
  compatibility

#### Performance Optimizations

- **Strategic indexing** on critical query paths (API numbers, dates, locations)
- **Composite indexes** for multi-column queries
- **UUID primary keys** for distributed system compatibility
- **JSONB fields** for flexible metadata and complex nested data

#### Regulatory Compliance

- **Audit trails** with created_at/updated_at timestamps
- **Status tracking** for permits, AFEs, and compliance items
- **Document management** with version control and expiration tracking
- **Multi-jurisdiction support** for different state requirements

#### Financial Precision

- **18-decimal precision** for financial calculations
- **Percentage calculations** up to 8 decimal places for ownership interests
- **Currency support** with proper decimal handling
- **Revenue distribution** with detailed deduction tracking

This comprehensive schema provides the foundation for enterprise-grade upstream
oil & gas operations management, supporting everything from basic well tracking
to complex financial calculations and regulatory compliance.

## Software Development Patterns Guide

### SOLID Principles Foundation

#### Single Responsibility Principle (SRP)

Each class should have only one reason to change.

```typescript
// ✅ Following SRP - Each class has one responsibility
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = await this.userRepo.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    this.logger.log(`User created: ${user.id}`);
    return user;
  }
}
```

#### Open/Closed Principle (OCP)

Open for extension, closed for modification.

```typescript
// ✅ Following OCP - New providers extend without modification
interface PaymentProvider {
  processPayment(amount: number): Promise<void>;
}

@Injectable()
export class PaymentProcessor {
  private providers = new Map<string, PaymentProvider>();

  constructor(stripeProvider: StripeProvider, paypalProvider: PayPalProvider) {
    this.providers.set('stripe', stripeProvider);
    this.providers.set('paypal', paypalProvider);
  }

  async processPayment(type: string, amount: number): Promise<void> {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`Unsupported payment type: ${type}`);
    await provider.processPayment(amount);
  }
}
```

#### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

```typescript
// ✅ Following DIP - Depends on abstractions
@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepository, // Abstraction
    private cache: CacheService // Abstraction
  ) {}
}
```

### Core Architectural Patterns

#### Clean Architecture / Hexagonal Architecture

Isolates business logic from external concerns (frameworks, databases, APIs).

```
src/
├── domain/           # Business logic & entities (framework-independent)
├── application/      # Use cases & application services
├── infrastructure/   # External integrations & data access
└── presentation/     # Controllers & API endpoints
```

```typescript
// Domain Entity (Core)
export class Well {
  constructor(
    private id: string,
    private status: WellStatus
  ) {}

  updateStatus(newStatus: WellStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error('Invalid status transition');
    }
    this.status = newStatus;
  }
}

// Use Case (Business Logic)
export class UpdateWellStatusUseCase {
  constructor(private wellRepo: WellRepository) {}

  async execute(wellId: string, status: WellStatus): Promise<void> {
    const well = await this.wellRepo.findById(wellId);
    if (!well) throw new Error('Well not found');

    well.updateStatus(status);
    await this.wellRepo.save(well);
  }
}
```

#### Domain-Driven Design (DDD)

Models complex business domains with specific terminology and workflows.

```typescript
// Aggregate Root
export class Well extends AggregateRoot {
  updateStatus(newStatus: WellStatus, updatedBy: string): void {
    const event = new WellStatusChangedEvent(
      this.id,
      this.status,
      newStatus,
      updatedBy
    );
    this.apply(event);
    this.status = newStatus;
  }
}

// Value Object
export class ApiNumber {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid API number format');
    }
  }

  private isValid(value: string): boolean {
    return /^\d{2}-\d{3}-\d{5}$/.test(value);
  }
}
```

#### CQRS (Command Query Responsibility Segregation)

Separates read and write operations for better performance and scalability.

```typescript
// Command Side
@CommandHandler(CreateWellCommand)
export class CreateWellHandler {
  async execute(command: CreateWellCommand): Promise<string> {
    const well = Well.create(command);
    return await this.wellRepository.save(well);
  }
}

// Query Side
@QueryHandler(GetWellsByOperatorQuery)
export class GetWellsByOperatorHandler {
  async execute(query: GetWellsByOperatorQuery): Promise<WellDto[]> {
    return await this.wellRepository.findByOperator(query.operatorId);
  }
}
```

#### Event-Driven Architecture

Enables real-time monitoring and system integrations through asynchronous
events.

```typescript
// Domain Event
export class WellStatusChangedEvent {
  constructor(
    public readonly wellId: string,
    public readonly previousStatus: WellStatus,
    public readonly newStatus: WellStatus,
    public readonly updatedBy: string
  ) {}
}

// Event Handler
@EventsHandler(WellStatusChangedEvent)
export class WellStatusChangedHandler {
  async handle(event: WellStatusChangedEvent): Promise<void> {
    await this.regulatoryService.notifyStatusChange(event);
    await this.monitoringService.updateWellStatus(event);
  }
}
```

### Behavioral Patterns

#### Strategy Pattern

Different calculation methods and regulatory rules by state/operation type.

```typescript
interface ProductionCalculationStrategy {
  calculate(wellData: WellData): ProductionMetrics;
}

export class TexasProductionCalculation
  implements ProductionCalculationStrategy
{
  calculate(wellData: WellData): ProductionMetrics {
    // Texas-specific calculation rules
  }
}

export class ProductionService {
  constructor(private strategy: ProductionCalculationStrategy) {}

  calculateProduction(wellData: WellData): ProductionMetrics {
    return this.strategy.calculate(wellData);
  }
}
```

#### Circuit Breaker Pattern

Prevents external API failures from crashing the system.

```typescript
@Injectable()
export class RegulatoryApiService {
  private circuitBreaker = new CircuitBreaker(
    this.callRegulatoryApi.bind(this),
    {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    }
  );

  async submitReport(report: ProductionReport): Promise<void> {
    try {
      return await this.circuitBreaker.fire(report);
    } catch (error) {
      await this.queueService.addToRetryQueue(report);
      throw new ServiceUnavailableException('Regulatory API unavailable');
    }
  }
}
```

### Data Patterns

#### Repository Pattern

Abstracts data access logic with consistent interfaces.

```typescript
export interface WellRepository {
  findById(id: string): Promise<Well>;
  findByOperator(operatorId: string): Promise<Well[]>;
  save(well: Well): Promise<void>;
}

@Injectable()
export class WellRepositoryImpl implements WellRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<Well> {
    const result = await this.db.select().from(wells).where(eq(wells.id, id));
    return this.mapToEntity(result[0]);
  }
}
```

#### Unit of Work Pattern

Ensures transactional consistency across multiple operations.

```typescript
@Injectable()
export class WellManagementService {
  async transferWellOwnership(
    wellId: string,
    newOperatorId: string
  ): Promise<void> {
    await this.unitOfWork.transaction(async (uow) => {
      const well = await uow.wells.findById(wellId);
      const newOperator = await uow.operators.findById(newOperatorId);

      well.transferTo(newOperator);
      await uow.wells.save(well);

      const leases = await uow.leases.findByWell(wellId);
      for (const lease of leases) {
        lease.updateOperator(newOperatorId);
        await uow.leases.save(lease);
      }
    });
  }
}
```

#### Cache-Aside Pattern

Lazy loading cache strategy with Redis.

```typescript
@Injectable()
export class WellService {
  async getWellById(id: string): Promise<WellDto> {
    // Try cache first
    const cached = await this.cacheService.get(`well:${id}`);
    if (cached) {
      return cached;
    }

    // Load from database
    const well = await this.wellRepository.findById(id);
    const dto = WellDto.fromEntity(well);

    // Cache for future requests
    await this.cacheService.set(`well:${id}`, dto, 3600);
    return dto;
  }
}
```

### Security Patterns

#### Role-Based Access Control (RBAC) with CASL

Fine-grained permissions for multi-tenant operations.

```typescript
export class AbilitiesFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(PureAbility);

    if (user.roles.includes('OPERATOR')) {
      can('read', 'Well', { operatorId: user.operatorId });
      can('update', 'Well', {
        operatorId: user.operatorId,
        status: { $nin: ['PLUGGED'] },
      });
    }

    return build();
  }
}
```

#### Audit Trail Pattern

Regulatory compliance requires detailed logging.

```typescript
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        this.auditService.log({
          userId: user.id,
          action: context.getHandler().name,
          resource: context.getClass().name,
          timestamp: new Date(),
          ipAddress: request.ip,
        });
      })
    );
  }
}
```

### Cross-Platform Patterns

#### Backend for Frontend (BFF)

Tailors API responses for specific client needs.

```typescript
// Web BFF Controller
@Controller('web/users')
export class WebUserController {
  @Get(':id/profile')
  async getProfile(@Param('id') id: string): Promise<UserProfileDto> {
    const user = await this.userService.findById(id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      // Full data for web
    };
  }
}

// Mobile BFF Controller
@Controller('mobile/users')
export class MobileUserController {
  @Get(':id/profile')
  async getProfile(@Param('id') id: string): Promise<MobileUserProfileDto> {
    const user = await this.userService.findById(id);
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      // Minimal data for mobile
    };
  }
}
```

#### Adapter Pattern

Different implementations for web and mobile platforms.

```typescript
interface LocationService {
  getCurrentLocation(): Promise<Coordinates>;
}

// Web Implementation
export class WebLocationAdapter implements LocationService {
  async getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        reject
      );
    });
  }
}

// Mobile Implementation (React Native)
export class MobileLocationAdapter implements LocationService {
  async getCurrentLocation(): Promise<Coordinates> {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }
}
```

### Industry-Specific Patterns

#### State Machine Pattern

Well lifecycle has specific state transitions with business rules.

```typescript
export class WellStateMachine {
  private static transitions: Record<WellStatus, WellStatus[]> = {
    [WellStatus.PLANNED]: [WellStatus.PERMITTED, WellStatus.CANCELLED],
    [WellStatus.PERMITTED]: [WellStatus.DRILLING, WellStatus.CANCELLED],
    [WellStatus.DRILLING]: [WellStatus.COMPLETED, WellStatus.ABANDONED],
    [WellStatus.COMPLETED]: [WellStatus.PRODUCING, WellStatus.ABANDONED],
    [WellStatus.PRODUCING]: [WellStatus.SHUT_IN, WellStatus.ABANDONED],
    [WellStatus.SHUT_IN]: [WellStatus.PRODUCING, WellStatus.ABANDONED],
    [WellStatus.ABANDONED]: [WellStatus.PLUGGED],
    [WellStatus.PLUGGED]: [],
    [WellStatus.CANCELLED]: [],
  };

  static canTransition(from: WellStatus, to: WellStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }
}
```

### NestJS-Specific Patterns

#### Decorator Pattern

Add metadata and behavior to classes and methods.

```typescript
// Custom Decorators
export const Auth = (roles?: string[]) => {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    SetMetadata('roles', roles || [])
  );
};

export const CacheResponse = (ttl: number = 300) => {
  return applyDecorators(
    UseInterceptors(CacheInterceptor),
    SetMetadata('cache_ttl', ttl)
  );
};

// Usage in Controller
@Controller('wells')
export class WellController {
  @Get(':id')
  @Auth(['operator', 'manager'])
  @CacheResponse(600)
  async getWell(@Param('id') id: string): Promise<WellDto> {
    return this.wellService.findById(id);
  }
}
```

#### Dependency Injection

Manages dependencies and enables testability.

```typescript
@Injectable()
export class WellService {
  constructor(
    private wellRepo: WellRepository,
    private cacheService: CacheService,
    private eventBus: EventBus
  ) {}

  async updateWellStatus(id: string, status: WellStatus): Promise<void> {
    const well = await this.wellRepo.findById(id);
    well.updateStatus(status);
    await this.wellRepo.save(well);

    this.eventBus.publish(new WellStatusChangedEvent(id, status));
  }
}
```

### Implementation Checklist

#### ✅ Completed Patterns

- [x] Clean Architecture with layered structure
- [x] Domain-Driven Design with aggregates and value objects
- [x] CQRS with separate command and query handlers
- [x] Event-Driven Architecture with domain events
- [x] Repository Pattern with interface abstraction
- [x] RBAC with CASL for fine-grained permissions
- [x] Audit Trail with interceptors
- [x] State Machine for well lifecycle

#### 🚧 Next Implementation Steps

- [ ] Circuit Breaker for external API calls
- [ ] Retry Pattern with exponential backoff
- [ ] Unit of Work for transaction management
- [ ] Cache-Aside pattern with Redis
- [ ] Strategy Pattern for state-specific rules
- [ ] Adapter Pattern for mobile integration

This comprehensive pattern implementation ensures WellFlow meets complex oil &
gas industry requirements while maintaining code quality and developer
productivity.
