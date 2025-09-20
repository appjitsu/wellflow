# Sprint 4: Well & Lease Management

## Sprint Overview

**Duration:** 2 weeks  
**Story Points:** 10 points  
**Sprint Goal:** Implement comprehensive well and lease management system with
regulatory compliance features and asset tracking.

## Sprint Objectives

1. Build lease management system with legal descriptions
2. Implement well registration with API number validation
3. Create well and lease relationship management
4. Develop asset tracking and status management
5. Build web interface for well and lease operations

## Deliverables

### 1. Lease Management System

- **Lease CRUD Operations**
  - Lease creation with legal descriptions
  - Lease information editing and updates
  - Lease status tracking (active/expired/terminated)
  - Lease expiration alerts and notifications
- **Legal Description Handling**
  - Structured legal description storage
  - Legal description validation
  - Boundary mapping integration ready
  - Acreage calculations

### 2. Well Registration & Management

- **Well Registration**
  - Well creation with API number validation
  - Surface and bottom hole location tracking
  - Well configuration and specifications
  - Completion date and status management
- **API Number Validation**
  - 14-digit API number format enforcement
  - State and county code validation
  - Duplicate API number prevention
  - API number lookup and verification

### 3. Well-Lease Relationships

- **Association Management**
  - Well-to-lease assignment
  - Multiple wells per lease support
  - Lease boundary validation for wells
  - Well transfer between leases
- **Hierarchy Visualization**
  - Lease-well tree structure
  - Well grouping by lease
  - Asset organization interface
  - Relationship audit trail

### 4. Asset Status & Tracking

- **Well Status Management**
  - Status tracking (drilling/producing/shut-in/plugged)
  - Status change history and audit trail
  - Automated status-based workflows
  - Regulatory status reporting
- **Asset Performance Tracking**
  - Well performance indicators
  - Lease-level aggregated metrics
  - Asset utilization reporting
  - Performance trend analysis

### 5. Web Interface

- **Lease Management Dashboard**
  - Lease list with status indicators
  - Lease detail views with well associations
  - Lease expiration calendar
  - Legal description display
- **Well Management Interface**
  - Well list with filtering and search
  - Well detail pages with specifications
  - Well status management controls
  - API number lookup tools

## Technical Requirements

### Data Validation

```typescript
// API number validation (14-digit format)
const apiNumberSchema = z
  .string()
  .length(14, 'API number must be exactly 14 digits')
  .regex(/^\d{14}$/, 'API number must contain only digits')
  .refine(validateStateCountyCodes, 'Invalid state/county codes');

// Legal description structure
interface LegalDescription {
  state: string;
  county: string;
  section: number;
  township: string;
  range: string;
  meridian: string;
  description: string;
}
```

### Business Rules

- Each well must have unique API number within organization
- Wells can only be assigned to leases within same state
- Lease expiration alerts sent 90, 30, and 7 days before expiration
- Well status changes require audit trail with user attribution
- Legal descriptions must include all required components

### Performance Requirements

- Well list loads in < 2 seconds for 100+ wells
- API number validation responds in < 100ms
- Lease-well relationship queries optimized with proper indexing
- Search functionality supports partial matches and filters

## Acceptance Criteria

### Lease Management

- [ ] Users can create leases with complete legal descriptions
- [ ] Lease expiration dates trigger automatic alerts
- [ ] Lease status can be updated with audit trail
- [ ] Legal descriptions validate required components
- [ ] Lease list supports filtering and search
- [ ] Lease detail view shows associated wells

### Well Management

- [ ] Wells can be registered with API number validation
- [ ] API numbers are validated for format and uniqueness
- [ ] Well status changes are tracked with history
- [ ] Wells can be assigned to appropriate leases
- [ ] Well specifications are stored and editable
- [ ] Well list supports advanced filtering

### Data Integrity

- [ ] API number format validation prevents invalid entries
- [ ] Duplicate API numbers are rejected
- [ ] Well-lease assignments validate geographic constraints
- [ ] Legal description components are required and validated
- [ ] Status changes maintain referential integrity

### User Interface

- [ ] Lease management interface is intuitive and responsive
- [ ] Well registration form validates inputs in real-time
- [ ] Search and filtering work across all relevant fields
- [ ] Asset hierarchy is clearly visualized
- [ ] Mobile-responsive design works on tablets

## Team Assignments

### Backend Lead Developer

- Well and lease API endpoints
- API number validation logic
- Business rule enforcement
- Database query optimization

### Backend Developer

- Legal description handling
- Status management system
- Audit trail implementation
- Search and filtering logic

### Frontend Developer

- Lease management interface
- Well registration forms
- Asset hierarchy visualization
- Search and filtering UI

### UI/UX Designer

- Well and lease management workflows
- Asset organization interface design
- Mobile-responsive layouts
- User experience optimization

## Dependencies

### From Previous Sprints

- ✅ Database schema with wells and leases tables
- ✅ Authentication and authorization system
- ✅ API foundation with validation

### External Dependencies

- State regulatory databases for API number validation
- Mapping services for location validation (future)
- Legal description parsing libraries

## API Endpoint Design

### Lease Endpoints

```typescript
// Lease management endpoints
POST   /api/v1/leases              // Create lease
GET    /api/v1/leases              // List leases with filtering
GET    /api/v1/leases/:id          // Get lease details
PUT    /api/v1/leases/:id          // Update lease
DELETE /api/v1/leases/:id          // Delete lease
GET    /api/v1/leases/:id/wells    // Get wells for lease
```

### Well Endpoints

```typescript
// Well management endpoints
POST   /api/v1/wells               // Register well
GET    /api/v1/wells               // List wells with filtering
GET    /api/v1/wells/:id           // Get well details
PUT    /api/v1/wells/:id           // Update well
DELETE /api/v1/wells/:id           // Delete well
PUT    /api/v1/wells/:id/status    // Update well status
GET    /api/v1/wells/api/:number   // Lookup by API number
```

## Data Model Validation

### Well Registration

```sql
-- API number validation constraint
ALTER TABLE wells ADD CONSTRAINT chk_valid_api_number
  CHECK (LENGTH(api_number) = 14 AND api_number ~ '^[0-9]+$');

-- Unique API number per organization
CREATE UNIQUE INDEX idx_wells_api_org ON wells(api_number, organization_id);

-- Well status validation
ALTER TABLE wells ADD CONSTRAINT chk_valid_status
  CHECK (status IN ('drilling', 'producing', 'shut_in', 'plugged'));
```

### Lease Management

```sql
-- Lease date validation
ALTER TABLE leases ADD CONSTRAINT chk_lease_dates
  CHECK (lease_end_date > lease_start_date);

-- Required legal description components
ALTER TABLE leases ADD CONSTRAINT chk_legal_description
  CHECK (legal_description ? 'state' AND legal_description ? 'county');
```

## Risks & Mitigation

### Data Quality Risks

- **Invalid API numbers**: Implement comprehensive validation
- **Incomplete legal descriptions**: Require all components
- **Duplicate entries**: Enforce unique constraints

### Performance Risks

- **Large well lists**: Implement pagination and filtering
- **Complex queries**: Optimize with proper indexing
- **Search performance**: Consider full-text search for large datasets

### Regulatory Risks

- **API number compliance**: Validate against state standards
- **Legal description accuracy**: Provide validation tools
- **Audit trail requirements**: Ensure complete change tracking

## Definition of Done

### Functional Requirements

- [ ] All lease management operations work correctly
- [ ] Well registration validates API numbers properly
- [ ] Asset relationships are maintained accurately
- [ ] Status management includes complete audit trail
- [ ] Web interface provides intuitive user experience

### Data Quality

- [ ] API number validation prevents all invalid formats
- [ ] Legal descriptions include all required components
- [ ] Well-lease relationships maintain referential integrity
- [ ] Status changes are properly audited and tracked

### Performance

- [ ] Well and lease lists load within performance targets
- [ ] Search and filtering respond quickly
- [ ] Database queries are optimized with proper indexes
- [ ] API endpoints meet response time requirements

## Success Metrics

- **Data Accuracy**: 100% valid API numbers in system
- **User Efficiency**: < 2 minutes to register a new well
- **System Performance**: < 2 seconds to load well list (100+ wells)
- **User Satisfaction**: Positive feedback on asset management workflow

## Next Sprint Preparation

- Mobile app architecture planning
- Offline data synchronization strategy
- Production data entry form design
- Field data collection workflow review

---

**Sprint 4 establishes the asset management foundation that production data and
compliance reporting will build upon. Accurate well and lease data is critical
for regulatory compliance.**
