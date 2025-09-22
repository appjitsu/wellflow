# Database Schema Enhancement Recommendations

## Executive Summary

Based on comprehensive research of oil and gas upstream operations, our current
database schema covers approximately **60%** of the complete business workflow.
This document outlines specific recommendations for enhancing the schema to
achieve **90%+ coverage** of industry-standard operations.

## Current Schema Assessment

### ✅ **Strengths (Well-Covered Areas)**

- **Core Business Entities**: Organizations, users, leases, wells
- **Production Operations**: Daily production records, well tests, equipment
  tracking
- **Partner Management**: Working/royalty interests, lease partnerships, JIB
  statements
- **Compliance Framework**: Regulatory reporting structure
- **Document Management**: Centralized file storage system
- **Multi-tenant Architecture**: Organization-based data isolation

### ❌ **Critical Gaps Identified**

## Priority 1: Essential Missing Tables

### 1. **AFE (Authorization for Expenditure) Management**

**Business Impact**: Critical for cost control and partner approvals
**Implementation Priority**: **HIGHEST**

```sql
-- AFE Management Tables
CREATE TABLE afes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  afe_number VARCHAR(50) NOT NULL,
  well_id UUID REFERENCES wells(id),
  lease_id UUID REFERENCES leases(id),
  afe_type VARCHAR(20) NOT NULL, -- drilling|completion|workover|facility
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|submitted|approved|rejected|closed
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  approved_amount DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  effective_date DATE,
  approval_date DATE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  approved_by_user_id UUID REFERENCES users(id),
  line_items JSONB DEFAULT '[]',
  partner_approvals JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT afes_org_number_unique UNIQUE (organization_id, afe_number)
);

CREATE TABLE afe_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  afe_id UUID NOT NULL REFERENCES afes(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- intangible|tangible|operating
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT afe_line_items_afe_line_unique UNIQUE (afe_id, line_number)
);
```

### 2. **Division Orders & Revenue Distribution**

**Business Impact**: Essential for revenue accounting and owner payments
**Implementation Priority**: **HIGH**

```sql
-- Revenue Distribution Tables
CREATE TABLE division_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  well_id UUID NOT NULL REFERENCES wells(id),
  owner_id UUID NOT NULL REFERENCES partners(id),
  decimal_interest DECIMAL(10,8) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active|suspended|terminated
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT division_orders_well_owner_date_unique
    UNIQUE (well_id, owner_id, effective_date)
);

CREATE TABLE revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  production_month DATE NOT NULL,
  well_id UUID NOT NULL REFERENCES wells(id),
  owner_id UUID NOT NULL REFERENCES partners(id),
  division_order_id UUID NOT NULL REFERENCES division_orders(id),
  gross_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  deductions JSONB DEFAULT '{}', -- taxes, transportation, processing
  payment_date DATE,
  check_number VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending|paid|cancelled
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT revenue_distributions_month_well_owner_unique
    UNIQUE (production_month, well_id, owner_id)
);
```

### 3. **Vendor & Service Company Management**

**Business Impact**: Critical for operations and cost tracking **Implementation
Priority**: **HIGH**

```sql
-- Vendor Management Tables
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  vendor_name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50) NOT NULL,
  vendor_type VARCHAR(50) NOT NULL, -- drilling_contractor|service_company|supplier|other
  tax_id VARCHAR(50),
  contact_info JSONB DEFAULT '{}',
  billing_address JSONB,
  payment_terms VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT vendors_org_code_unique UNIQUE (organization_id, vendor_code)
);

CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  contact_type VARCHAR(50), -- primary|billing|technical|emergency
  email VARCHAR(255),
  phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Cost Centers & Expense Tracking**

**Business Impact**: Essential for financial management and AFE tracking
**Implementation Priority**: **HIGH**

```sql
-- Cost Accounting Tables
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  cost_center_code VARCHAR(20) NOT NULL,
  description VARCHAR(255) NOT NULL,
  cost_center_type VARCHAR(50), -- well|lease|facility|corporate
  afe_id UUID REFERENCES afes(id),
  well_id UUID REFERENCES wells(id),
  lease_id UUID REFERENCES leases(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT cost_centers_org_code_unique UNIQUE (organization_id, cost_center_code)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  cost_center_id UUID NOT NULL REFERENCES cost_centers(id),
  afe_id UUID REFERENCES afes(id),
  vendor_id UUID REFERENCES vendors(id),
  expense_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  expense_category VARCHAR(50), -- drilling|completion|operating|overhead
  invoice_number VARCHAR(100),
  gl_account VARCHAR(20),
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending|approved|rejected
  approved_by_user_id UUID REFERENCES users(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Priority 2: Operational Enhancement Tables

### 5. **Work Orders & Maintenance Management**

**Business Impact**: Improves operational efficiency and equipment tracking
**Implementation Priority**: **MEDIUM**

```sql
-- Work Order Management
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  work_order_number VARCHAR(50) NOT NULL,
  well_id UUID NOT NULL REFERENCES wells(id),
  equipment_id UUID REFERENCES equipment(id),
  work_type VARCHAR(50) NOT NULL, -- maintenance|repair|inspection|upgrade|installation
  priority VARCHAR(20) DEFAULT 'medium', -- low|medium|high|emergency
  status VARCHAR(20) DEFAULT 'open', -- open|assigned|in_progress|completed|cancelled
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE,
  started_date DATE,
  completed_date DATE,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  assigned_to_user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT work_orders_org_number_unique UNIQUE (organization_id, work_order_number)
);

CREATE TABLE work_order_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending|in_progress|completed|skipped
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  completed_by_user_id UUID REFERENCES users(id),
  completed_at TIMESTAMP,

  CONSTRAINT work_order_tasks_order_number_unique UNIQUE (work_order_id, task_number)
);
```

## Priority 3: Enhanced Field Additions

### 6. **Additional Fields for Existing Tables**

```sql
-- Enhance Wells table
ALTER TABLE wells ADD COLUMN IF NOT EXISTS
  operator_id UUID REFERENCES partners(id),
  drilling_contractor_id UUID REFERENCES vendors(id),
  completion_contractor_id UUID REFERENCES vendors(id),
  permit_number VARCHAR(100),
  permit_date DATE,
  plugging_date DATE,
  abandonment_cost DECIMAL(12,2);

-- Enhance Leases table
ALTER TABLE leases ADD COLUMN IF NOT EXISTS
  lease_type VARCHAR(50), -- oil|gas|oil_gas
  primary_term_years INTEGER,
  royalty_rate DECIMAL(5,4), -- e.g., 0.1250 for 12.5%
  bonus_amount DECIMAL(12,2),
  rental_amount DECIMAL(10,2),
  rental_due_date DATE,
  lessor_name VARCHAR(255),
  lessor_contact JSONB;

-- Enhance Production Records table
ALTER TABLE production_records ADD COLUMN IF NOT EXISTS
  oil_price_posted DECIMAL(8,4),
  gas_price_posted DECIMAL(8,4),
  transportation_fee DECIMAL(8,4),
  processing_fee DECIMAL(8,4),
  severance_tax_rate DECIMAL(5,4);

-- Enhance Partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS
  partner_type VARCHAR(50), -- working_interest|royalty|overriding_royalty
  w9_on_file BOOLEAN DEFAULT false,
  payment_method VARCHAR(50), -- check|ach|wire
  minimum_payment_threshold DECIMAL(10,2) DEFAULT 25.00;
```

## Implementation Timeline

### **Phase 1: Critical Financial Operations (Months 1-2)**

1. AFE Management System
2. Vendor Management
3. Cost Centers & Expense Tracking
4. Enhanced fields for existing tables

### **Phase 2: Revenue Operations (Months 2-3)**

1. Division Orders
2. Revenue Distribution
3. Enhanced partner management
4. Payment processing integration

### **Phase 3: Operational Excellence (Months 3-4)**

1. Work Order Management
2. Enhanced production tracking
3. Advanced reporting capabilities
4. Mobile field application support

## Database Indexes & Performance

```sql
-- Critical indexes for new tables
CREATE INDEX idx_afes_organization_status ON afes(organization_id, status);
CREATE INDEX idx_afes_well_id ON afes(well_id);
CREATE INDEX idx_division_orders_well_owner ON division_orders(well_id, owner_id);
CREATE INDEX idx_revenue_distributions_month ON revenue_distributions(production_month);
CREATE INDEX idx_expenses_date_amount ON expenses(expense_date, amount);
CREATE INDEX idx_work_orders_well_status ON work_orders(well_id, status);
```

## Migration Strategy

1. **Backward Compatibility**: All new tables and fields are additive
2. **Data Migration**: Existing data remains unchanged
3. **Gradual Rollout**: Implement features incrementally
4. **Testing**: Comprehensive testing at each phase
5. **Documentation**: Update API documentation and user guides

## Conclusion

These enhancements will bring our database schema from **60%** to **90%+**
coverage of oil and gas upstream operations, positioning WellFlow as a
comprehensive industry solution.

**Expected Benefits:**

- Complete AFE and cost management workflow
- Automated revenue distribution and owner payments
- Comprehensive vendor and service company tracking
- Professional work order and maintenance management
- Industry-standard financial reporting and compliance
