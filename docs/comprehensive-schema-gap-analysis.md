# Comprehensive Oil & Gas Schema Gap Analysis

## Executive Summary

After conducting extensive research into each aspect of oil and gas upstream
operations, this document identifies **critical gaps** in our current database
schema that must be addressed to achieve industry-standard coverage. Our
analysis reveals we're missing several **essential operational components**
beyond the initial assessment.

## Current Schema: 12 Core Tables

1. **organizations** - Multi-tenant root entity
2. **users** - Role-based access control
3. **leases** - Legal agreements for extraction rights
4. **wells** - Individual wellbores
5. **production_records** - Daily production tracking
6. **partners** - Joint venture partners and royalty owners
7. **lease_partners** - Ownership interests in leases
8. **compliance_reports** - Regulatory reporting
9. **jib_statements** - Joint Interest Billing
10. **documents** - Centralized file storage
11. **equipment** - Well equipment inventory
12. **well_tests** - Performance testing

## Detailed Gap Analysis by Business Area

### 1. **Land Management & Lease Administration**

**Current Coverage**: 40% - Basic lease information only

#### ❌ **Critical Missing Components:**

**Title Management System**

```sql
CREATE TABLE title_opinions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  lease_id UUID NOT NULL,
  opinion_date DATE NOT NULL,
  examiner_name VARCHAR(255),
  title_company VARCHAR(255),
  opinion_type VARCHAR(50), -- preliminary|final|supplemental
  defects_identified JSONB,
  curative_requirements JSONB,
  status VARCHAR(20) DEFAULT 'pending' -- pending|approved|rejected
);

CREATE TABLE curative_items (
  id UUID PRIMARY KEY,
  title_opinion_id UUID NOT NULL,
  defect_type VARCHAR(100), -- missing_heir|invalid_deed|tax_lien
  description TEXT,
  priority VARCHAR(20), -- critical|high|medium|low
  status VARCHAR(20) DEFAULT 'open', -- open|in_progress|resolved
  resolution_date DATE,
  cost DECIMAL(10,2)
);
```

**Lease Expiration & Renewal Tracking**

```sql
ALTER TABLE leases ADD COLUMN
  primary_term_years INTEGER,
  extension_options INTEGER DEFAULT 0,
  automatic_renewal BOOLEAN DEFAULT false,
  notice_period_days INTEGER DEFAULT 30,
  rental_due_date DATE,
  next_rental_amount DECIMAL(10,2);

CREATE TABLE lease_renewals (
  id UUID PRIMARY KEY,
  lease_id UUID NOT NULL,
  renewal_date DATE NOT NULL,
  new_expiration_date DATE NOT NULL,
  renewal_bonus DECIMAL(12,2),
  new_rental_rate DECIMAL(10,2),
  terms_changed JSONB
);
```

### 2. **Drilling Operations Management**

**Current Coverage**: 30% - Basic well information only

#### ❌ **Critical Missing Components:**

**Daily Drilling Reports (DDR)**

```sql
CREATE TABLE drilling_reports (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  well_id UUID NOT NULL,
  report_date DATE NOT NULL,
  depth_start DECIMAL(8,2),
  depth_end DECIMAL(8,2),
  footage_drilled DECIMAL(8,2),
  drilling_time_hours DECIMAL(5,2),
  circulation_time_hours DECIMAL(5,2),
  trip_time_hours DECIMAL(5,2),
  mud_properties JSONB, -- weight, viscosity, pH, etc.
  formation_tops JSONB,
  drilling_problems JSONB,
  daily_cost DECIMAL(10,2),
  contractor_id UUID REFERENCES vendors(id),
  created_by_user_id UUID NOT NULL
);
```

**Well Logs & Completion Data**

```sql
CREATE TABLE well_logs (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  log_type VARCHAR(50), -- mud_log|electric_log|gamma_ray|neutron
  log_date DATE NOT NULL,
  depth_from DECIMAL(8,2),
  depth_to DECIMAL(8,2),
  service_company_id UUID REFERENCES vendors(id),
  log_data JSONB, -- formations, shows, measurements
  file_path VARCHAR(500)
);

CREATE TABLE completions (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  completion_date DATE,
  completion_type VARCHAR(50), -- cased_hole|open_hole|horizontal
  perforations JSONB, -- depth intervals, shot density
  stimulation_data JSONB, -- frac stages, proppant, fluid
  tubing_size DECIMAL(4,2),
  packer_depth DECIMAL(8,2),
  completion_cost DECIMAL(12,2)
);
```

### 3. **Production Operations & Measurement**

**Current Coverage**: 70% - Good foundation, missing critical details

#### ❌ **Missing Advanced Components:**

**Custody Transfer & Measurement**

```sql
CREATE TABLE measurement_points (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  measurement_type VARCHAR(50), -- tank_gauge|LACT|orifice_meter|turbine
  location_description VARCHAR(255),
  meter_serial_number VARCHAR(100),
  calibration_date DATE,
  next_calibration_date DATE,
  measurement_accuracy DECIMAL(5,4), -- +/- percentage
  is_custody_transfer BOOLEAN DEFAULT false
);

CREATE TABLE tank_gauges (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  measurement_point_id UUID NOT NULL,
  gauge_date DATE NOT NULL,
  gauge_time TIME,
  tank_number VARCHAR(20),
  gross_volume DECIMAL(10,2),
  net_volume DECIMAL(10,2), -- after BS&W deduction
  temperature DECIMAL(5,2),
  api_gravity DECIMAL(5,2),
  bsw_percent DECIMAL(5,4), -- basic sediment & water
  gauged_by_user_id UUID NOT NULL
);
```

**Production Allocation & Shrinkage**

```sql
CREATE TABLE allocation_factors (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  allocation_month DATE NOT NULL,
  gross_production DECIMAL(12,2),
  shrinkage_factor DECIMAL(6,5), -- processing losses
  btu_adjustment DECIMAL(6,5), -- heating value adjustment
  transportation_loss DECIMAL(6,5),
  net_production DECIMAL(12,2),
  allocation_method VARCHAR(50) -- deliverability|capacity|historical
);
```

### 4. **Environmental & Regulatory Compliance**

**Current Coverage**: 50% - Basic reporting, missing operational tracking

#### ❌ **Critical Missing Components:**

**Environmental Incidents & Spill Reporting**

```sql
CREATE TABLE environmental_incidents (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  well_id UUID,
  incident_date TIMESTAMP NOT NULL,
  incident_type VARCHAR(50), -- spill|emission|leak|blowout
  severity VARCHAR(20), -- minor|major|catastrophic
  substance VARCHAR(100), -- crude_oil|produced_water|natural_gas
  quantity_released DECIMAL(10,2),
  cause VARCHAR(255),
  immediate_actions TEXT,
  regulatory_notification_date TIMESTAMP,
  cleanup_cost DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'open' -- open|investigating|remediation|closed
);

CREATE TABLE air_emissions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  well_id UUID,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  emission_type VARCHAR(50), -- methane|voc|nox|co2
  emission_quantity DECIMAL(12,4), -- tons or MCF
  calculation_method VARCHAR(100),
  emission_factor DECIMAL(10,6),
  control_efficiency DECIMAL(5,4) -- if controls applied
);
```

### 5. **Reserves Management & SEC Reporting**

**Current Coverage**: 0% - Completely missing

#### ❌ **Critical Missing Components:**

**Reserves Estimation & Tracking**

```sql
CREATE TABLE reserves_estimates (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  well_id UUID,
  lease_id UUID,
  estimate_date DATE NOT NULL,
  estimate_type VARCHAR(20), -- proved|probable|possible
  reserve_category VARCHAR(20), -- PDP|PUD|PDNP
  oil_reserves DECIMAL(12,2), -- barrels
  gas_reserves DECIMAL(15,2), -- MCF
  ngl_reserves DECIMAL(12,2), -- barrels
  economic_limit_date DATE,
  discount_rate DECIMAL(5,4),
  oil_price_deck DECIMAL(8,4),
  gas_price_deck DECIMAL(8,4),
  estimated_by VARCHAR(255), -- engineer name
  estimation_method VARCHAR(100) -- decline_curve|volumetric|analogy
);

CREATE TABLE decline_curves (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  reserves_estimate_id UUID NOT NULL,
  curve_type VARCHAR(20), -- exponential|hyperbolic|harmonic
  initial_rate DECIMAL(10,2),
  decline_rate DECIMAL(8,6),
  b_factor DECIMAL(4,3), -- for hyperbolic curves
  economic_limit DECIMAL(8,2),
  curve_fit_r_squared DECIMAL(5,4)
);
```

### 6. **Field Operations & Maintenance**

**Current Coverage**: 40% - Basic equipment tracking, missing operational
workflows

#### ❌ **Missing Operational Components:**

**Pumper Routes & Field Inspections**

```sql
CREATE TABLE pumper_routes (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  route_name VARCHAR(100) NOT NULL,
  assigned_user_id UUID NOT NULL REFERENCES users(id),
  wells JSONB, -- array of well IDs in route order
  frequency VARCHAR(20), -- daily|weekly|monthly
  estimated_time_hours DECIMAL(4,2),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE field_inspections (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  pumper_route_id UUID,
  inspection_date DATE NOT NULL,
  inspection_time TIME,
  inspected_by_user_id UUID NOT NULL,
  well_status VARCHAR(20), -- producing|down|shut_in
  equipment_status JSONB, -- pump, tanks, meters status
  safety_issues JSONB,
  maintenance_needed JSONB,
  notes TEXT,
  photos JSONB -- file paths to inspection photos
);
```

**Chemical Treatments & Well Interventions**

```sql
CREATE TABLE chemical_treatments (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  treatment_date DATE NOT NULL,
  chemical_type VARCHAR(100), -- corrosion_inhibitor|scale_inhibitor|biocide
  chemical_name VARCHAR(255),
  quantity_used DECIMAL(8,2),
  concentration DECIMAL(6,4),
  injection_method VARCHAR(50), -- batch|continuous|squeeze
  cost DECIMAL(8,2),
  vendor_id UUID REFERENCES vendors(id),
  effectiveness_rating INTEGER -- 1-5 scale
);
```

### 7. **Transportation & Marketing**

**Current Coverage**: 10% - Basic pricing in production records only

#### ❌ **Critical Missing Components:**

**Pipeline Connections & Transportation**

```sql
CREATE TABLE pipeline_connections (
  id UUID PRIMARY KEY,
  well_id UUID NOT NULL,
  pipeline_company VARCHAR(255) NOT NULL,
  connection_point VARCHAR(255),
  product_type VARCHAR(20), -- oil|gas|water
  connection_date DATE,
  capacity DECIMAL(10,2), -- barrels/day or MCF/day
  transportation_fee DECIMAL(8,4), -- per unit
  minimum_delivery DECIMAL(8,2),
  contract_expiration DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE sales_contracts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  well_id UUID,
  lease_id UUID,
  buyer_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(20), -- oil|gas|ngl
  contract_type VARCHAR(50), -- spot|term|evergreen
  pricing_mechanism VARCHAR(100), -- posted|index|fixed|netback
  base_price DECIMAL(8,4),
  price_adjustments JSONB, -- gravity, sulfur, location differentials
  minimum_volume DECIMAL(10,2),
  contract_start_date DATE,
  contract_end_date DATE,
  payment_terms VARCHAR(50)
);
```

## Summary of Critical Gaps

### **Tier 1: Mission-Critical (Must Have)**

1. **AFE Management** - Cost control and approvals
2. **Division Orders** - Revenue distribution
3. **Vendor Management** - Service company coordination
4. **Title Management** - Legal compliance
5. **Daily Drilling Reports** - Operational tracking
6. **Environmental Incidents** - Regulatory compliance
7. **Reserves Management** - SEC reporting requirements

### **Tier 2: Operationally Important (Should Have)**

1. **Custody Transfer & Measurement** - Production accuracy
2. **Field Inspections** - Operational efficiency
3. **Chemical Treatments** - Well maintenance
4. **Pipeline Connections** - Transportation management
5. **Work Orders** - Maintenance scheduling
6. **Production Allocation** - Complex revenue calculations

### **Tier 3: Enhancement Features (Nice to Have)**

1. **Well Logs** - Technical data management
2. **Decline Curves** - Production forecasting
3. **Air Emissions** - Environmental reporting
4. **Pumper Routes** - Field operation optimization

## Revised Schema Coverage Assessment

### **Current State: ~35% Coverage** (Lower than initial estimate)

Our deeper analysis reveals we're missing more critical components than
initially assessed:

- ❌ **Land Management**: Missing 60% (title, curative, renewals)
- ❌ **Drilling Operations**: Missing 70% (DDR, logs, completions)
- ✅ **Production Tracking**: Good coverage (70%)
- ❌ **Environmental Compliance**: Missing 50% (incidents, emissions)
- ❌ **Reserves Management**: Missing 100% (SEC reporting)
- ❌ **Transportation**: Missing 90% (pipelines, contracts)
- ❌ **Field Operations**: Missing 60% (inspections, treatments)

## Implementation Priority Matrix

### **Phase 1: Financial & Legal Foundation (Months 1-3)**

**Priority: CRITICAL**

- AFE Management System
- Division Orders & Revenue Distribution
- Vendor Management
- Title Management & Curative Tracking
- Cost Centers & Expense Tracking

### **Phase 2: Operational Excellence (Months 3-6)**

**Priority: HIGH**

- Daily Drilling Reports
- Environmental Incident Tracking
- Field Inspections & Pumper Routes
- Work Orders & Maintenance
- Custody Transfer & Measurement

### **Phase 3: Advanced Analytics (Months 6-9)**

**Priority: MEDIUM**

- Reserves Management & SEC Reporting
- Production Allocation & Shrinkage
- Pipeline Connections & Sales Contracts
- Chemical Treatments & Well Interventions
- Decline Curves & Forecasting

### **Phase 4: Technical Enhancement (Months 9-12)**

**Priority: LOW**

- Well Logs & Completion Data
- Air Emissions Tracking
- Advanced Production Analytics
- Mobile Field Applications
- GIS Integration

## Database Design Considerations

### **Performance Requirements**

- **Time-series data**: Production records, drilling reports, field inspections
- **Document storage**: Well logs, environmental reports, contracts
- **Audit trails**: All financial transactions and regulatory submissions
- **Real-time updates**: Field inspections, production data, incident reports

### **Compliance Requirements**

- **SOX compliance**: Financial data integrity and audit trails
- **SEC reporting**: Reserves data and financial disclosures
- **Environmental regulations**: Incident reporting and emissions tracking
- **State regulations**: Production reporting and tax compliance

## Conclusion

Our comprehensive analysis reveals that achieving **industry-standard coverage
requires implementing 25+ additional tables** and enhancing existing tables with
critical fields. The current schema provides a solid foundation but covers only
**~35%** of complete upstream operations.

**Key Findings:**

1. **Financial operations** are the highest priority gap
2. **Environmental compliance** is critically under-represented
3. **Reserves management** is completely missing (SEC requirement)
4. **Field operations** need significant enhancement
5. **Transportation & marketing** require dedicated modules

**Recommended Action:** Implement the **Phase 1 critical components**
immediately to achieve basic industry compliance, then proceed with operational
enhancements in subsequent phases.

This analysis ensures WellFlow will become a comprehensive, industry-compliant
upstream operations management system.
