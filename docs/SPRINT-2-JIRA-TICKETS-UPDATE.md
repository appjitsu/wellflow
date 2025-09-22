# Sprint 2 Jira Tickets Update Summary

**Last Updated**: January 2025  
**Status**: Action Required  
**Purpose**: Document required Jira ticket updates for Sprint 2 based on updated
requirements

## 📋 **Current Sprint 2 Tickets Status**

### **✅ Existing Tickets (Verified)**

1. **KAN-26** - Sprint 2: Database Schema & Core API Foundation (Epic)
   - Status: To Do
   - **NEEDS UPDATE**: Description should reflect new critical components

2. **KAN-27** - Database Schema Implementation
   - Status: In Progress
   - **NEEDS UPDATE**: Add Phase 1A, 1B, Phase 2 table requirements

3. **KAN-30** - API Foundation & Endpoints
   - Status: To Do
   - **CURRENT**: Covers basic API endpoints

4. **KAN-33** - Performance Optimization & Indexing
   - Status: To Do
   - **CURRENT**: Performance requirements covered

5. **KAN-34** - Data Validation & Business Rules
   - Status: To Do
   - **NEEDS UPDATE**: Should include 14-digit API number validation

6. **KAN-35** - Testing & Quality Assurance
   - Status: To Do
   - **CURRENT**: Testing requirements covered

## 🚨 **Missing Critical Tickets (MUST CREATE)**

### **Phase 1A: Financial Foundation (HIGH PRIORITY)**

#### **1. AFE Management System Implementation**

```
Summary: AFE Management System Implementation
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement Authorization for Expenditure (AFE) management system - Phase 1A Critical Component.

Database Tables Required:
- afes: Core AFE records with approval status
- afe_line_items: Detailed cost breakdown
- afe_approvals: Partner approval tracking

API Endpoints:
- POST /api/v1/afes - Create new AFE
- GET /api/v1/afes - List AFEs with filtering
- PUT /api/v1/afes/{id} - Update AFE details
- POST /api/v1/afes/{id}/submit - Submit for approval
- POST /api/v1/afes/{id}/approve - Partner approval

Business Logic:
- Cost estimation and budget tracking
- Partner approval workflow automation
- Budget variance monitoring
- Integration with vendor management

Acceptance Criteria:
- AFE creation with line item details
- Partner approval workflow functional
- Cost tracking and budget monitoring
- Integration with JIB statements
- Audit trail for all AFE changes

Story Points: 8
```

#### **2. Division Orders & Revenue Distribution**

```
Summary: Division Orders & Revenue Distribution System
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement division orders and revenue distribution system - Phase 1A Critical Component.

Database Tables Required:
- division_orders: Owner decimal interests
- revenue_distributions: Monthly payment calculations
- owner_statements: Payment documentation

API Endpoints:
- POST /api/v1/division-orders - Create division order
- GET /api/v1/division-orders - List by well/owner
- POST /api/v1/revenue-distributions - Calculate distributions
- GET /api/v1/owner-statements - Generate statements

Business Logic:
- Decimal interest calculations
- Revenue allocation by ownership
- Payment processing workflows
- Owner statement generation

Acceptance Criteria:
- Division order creation and management
- Accurate revenue calculations
- Owner statement generation
- Payment tracking and audit trails
- Integration with production data

Story Points: 8
```

#### **3. Lease Operating Statements (LOS) - NEW CRITICAL**

```
Summary: Lease Operating Statements (LOS) Implementation
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement Lease Operating Statements system - Phase 1A NEW Critical Component.

Database Tables Required:
- lease_operating_statements: Monthly LOS records
- operating_expenses: Expense categorization
- expense_allocations: Cost allocation to partners

API Endpoints:
- POST /api/v1/lease-operating-statements - Create LOS
- GET /api/v1/lease-operating-statements - List by lease/period
- PUT /api/v1/lease-operating-statements/{id} - Update LOS
- POST /api/v1/los/{id}/distribute - Distribute to partners

Business Logic:
- Operating expense allocation
- Partner cost sharing calculations
- LOS statement generation
- Integration with AFE and JIB systems

Acceptance Criteria:
- LOS creation with expense details
- Partner cost allocation
- Statement generation and distribution
- Integration with financial systems
- Audit trail for all transactions

Story Points: 6
```

#### **4. Vendor Management System**

```
Summary: Vendor Management System Implementation
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement vendor and service company management system - Phase 1A Critical Component.

Database Tables Required:
- vendors: Service company information
- vendor_contacts: Contact management
- service_contracts: Contract tracking

API Endpoints:
- POST /api/v1/vendors - Create vendor
- GET /api/v1/vendors - List vendors with filtering
- PUT /api/v1/vendors/{id} - Update vendor info
- POST /api/v1/vendors/{id}/contracts - Manage contracts

Business Logic:
- Vendor qualification tracking
- Contract management
- Performance monitoring
- Integration with AFE and work orders

Acceptance Criteria:
- Vendor creation and management
- Contract tracking and renewal alerts
- Performance metrics tracking
- Integration with cost tracking
- Vendor communication workflows

Story Points: 5
```

### **Phase 1B: Legal & Environmental Compliance (HIGH PRIORITY)**

#### **5. Title Management & Curative System**

```
Summary: Title Management & Curative Tracking System
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement title management and curative tracking system - Phase 1B Critical Component.

Database Tables Required:
- title_opinions: Title examination records
- curative_items: Defect tracking and resolution
- title_documents: Document management

API Endpoints:
- POST /api/v1/title-opinions - Create title opinion
- GET /api/v1/title-opinions - List by lease
- POST /api/v1/curative-items - Track curative items
- PUT /api/v1/curative-items/{id} - Update resolution status

Business Logic:
- Title defect identification
- Curative workflow automation
- Document tracking and alerts
- Legal compliance monitoring

Acceptance Criteria:
- Title opinion creation and tracking
- Curative item workflow management
- Document association and tracking
- Alert system for pending items
- Legal compliance reporting

Story Points: 6
```

#### **6. Environmental Incident Tracking**

```
Summary: Environmental Incident Tracking System
Type: Task
Parent: KAN-26
Priority: High
Description:
Implement environmental incident tracking and reporting system - Phase 1B Critical Component.

Database Tables Required:
- environmental_incidents: Incident records
- spill_reports: Spill-specific data
- remediation_actions: Cleanup tracking

API Endpoints:
- POST /api/v1/environmental-incidents - Report incident
- GET /api/v1/environmental-incidents - List incidents
- PUT /api/v1/incidents/{id} - Update incident status
- POST /api/v1/incidents/{id}/remediation - Track cleanup

Business Logic:
- Incident severity classification
- Regulatory notification automation
- Remediation tracking
- Compliance reporting

Acceptance Criteria:
- Incident reporting and classification
- Automated regulatory notifications
- Remediation progress tracking
- Compliance report generation
- Integration with regulatory systems

Story Points: 7
```

### **Phase 2: Operational Foundation (MEDIUM PRIORITY)**

#### **7. Automated Regulatory Reporting Framework**

```
Summary: Automated Regulatory Reporting Framework
Type: Task
Parent: KAN-26
Priority: Medium
Description:
Implement automated regulatory reporting framework - Phase 2 Priority Component.

Database Tables Required:
- regulatory_filings: Filing records and status
- compliance_schedules: Deadline tracking
- form_templates: Automated form generation

API Endpoints:
- POST /api/v1/regulatory-filings - Create filing
- GET /api/v1/compliance-schedules - Track deadlines
- POST /api/v1/forms/generate - Auto-generate forms
- POST /api/v1/forms/submit - Submit to agencies

Business Logic:
- Form PR automation for Texas RRC
- Severance tax calculations
- Deadline monitoring and alerts
- Multi-state compliance support

Acceptance Criteria:
- Automated Form PR generation
- Texas RRC Portal integration
- Deadline tracking and alerts
- Multi-state compliance framework
- Audit trail for all submissions

Story Points: 8
```

## 📊 **Updated Sprint 2 Scope Summary**

### **Original Scope (12 Story Points)**

- Database Schema Implementation
- API Foundation & Endpoints
- Performance Optimization
- Data Validation
- Testing & QA

### **Updated Scope (59 Story Points)**

- **Original Components**: 12 points
- **Phase 1A Financial**: 27 points (AFE: 8, Division Orders: 8, LOS: 6,
  Vendors: 5)
- **Phase 1B Compliance**: 13 points (Title: 6, Environmental: 7)
- **Phase 2 Foundation**: 8 points (Regulatory Reporting: 8)

### **Recommendation: Split Into Multiple Sprints**

**Sprint 2A: Core Foundation (3 weeks, 20 points)**

- Original database schema and API work
- AFE Management System
- Division Orders & Revenue Distribution

**Sprint 2B: Financial & Legal (3 weeks, 19 points)**

- Lease Operating Statements
- Vendor Management System
- Title Management & Curative

**Sprint 2C: Compliance & Automation (3 weeks, 20 points)**

- Environmental Incident Tracking
- Automated Regulatory Reporting Framework
- Integration testing and validation

## 🎯 **Immediate Actions Required**

### **Next 24 Hours**

1. **Update KAN-26 Epic** - Add new critical components to description
2. **Update KAN-27** - Add Phase 1A, 1B, Phase 2 table requirements
3. **Update KAN-34** - Include 14-digit API number validation
4. **Create 6 New High-Priority Tickets** - AFE, Division Orders, LOS, Vendors,
   Title, Environmental

### **Next Week**

1. **Create Sprint 2B and 2C Epics** - Split the expanded scope
2. **Resource Planning** - Assess team capacity for expanded scope
3. **Stakeholder Communication** - Inform about scope expansion and timeline
   impact
4. **Integration Planning** - Plan for industry software integration framework

## 📋 **Ticket Creation Template**

For each missing ticket, use this template in Jira:

```
Project: KAN (wellflow)
Issue Type: Task
Parent: KAN-26
Priority: High (for Phase 1A/1B), Medium (for Phase 2)
Components: Backend, Database
Labels: sprint-2, phase-1a, critical-component
```

---

**This document provides the complete roadmap for updating Sprint 2 Jira tickets
to match the validated industry requirements and critical component analysis.**
