# Sprint 12: Partner Management & Basic JIB

## Sprint Overview

**Duration:** 3 weeks  
**Story Points:** 13 points  
**Sprint Goal:** Build partner management system with ownership tracking, basic
Joint Interest Billing (JIB) framework, and partner communication tools.

## Sprint Objectives

1. Create partner management system with ownership tracking
2. Build lease partnership and working interest management
3. Implement basic JIB framework and data models
4. Develop partner communication and document sharing
5. Create partner dashboard and reporting interface

## Deliverables

### 1. Partner Management System

- **Partner Registration**
  - Partner company and contact information
  - Tax ID and billing address management
  - Partner classification (working interest, royalty, etc.)
  - Partner status and relationship tracking
- **Contact Management**
  - Multiple contacts per partner
  - Role-based contact assignments
  - Communication preferences
  - Contact history and notes

### 2. Ownership & Interest Management

- **Working Interest Tracking**
  - Percentage ownership by lease and well
  - Effective date tracking for ownership changes
  - Interest type classification (WI, RI, ORRI)
  - Ownership validation and balancing
- **Lease Partnership Management**
  - Partner assignments to leases
  - Operating agreement references
  - Cost sharing arrangements
  - Decision-making authority levels

### 3. Basic JIB Framework

- **JIB Data Models**
  - Joint Interest Billing statement structure
  - Cost allocation and distribution models
  - Revenue sharing calculations
  - Billing period and frequency management
- **Cost Tracking**
  - Operating expense categories
  - Cost allocation methods (per well, per lease, AFE)
  - Vendor invoice management
  - Cost approval workflows

### 4. Partner Communication

- **Document Sharing**
  - Partner-specific document access
  - Production reports and statements
  - Operating agreements and amendments
  - Regulatory filings and notices
- **Notification System**
  - Partner-specific notifications
  - JIB statement distribution
  - Important deadline alerts
  - Document sharing notifications

### 5. Partner Dashboard

- **Partner Portal**
  - Partner-specific login and dashboard
  - Ownership summary and details
  - Production and revenue reports
  - Document access and downloads
- **Operator Interface**
  - Partner management tools
  - Ownership editing and updates
  - JIB statement preparation
  - Communication tracking

## Technical Requirements

### Partner Data Models

```typescript
// Partner management entities
interface Partner {
  id: string;
  organizationId: string;
  companyName: string;
  taxId: string;
  partnerType: PartnerType;
  status: PartnerStatus;
  billingAddress: Address;
  contacts: PartnerContact[];
  bankingInfo?: BankingInfo;
  createdAt: Date;
  updatedAt: Date;
}

enum PartnerType {
  WORKING_INTEREST = "working_interest",
  ROYALTY_OWNER = "royalty_owner",
  OVERRIDING_ROYALTY = "overriding_royalty",
  NET_PROFITS = "net_profits",
  CARRIED_INTEREST = "carried_interest",
}

interface LeasePartnership {
  id: string;
  leaseId: string;
  partnerId: string;
  interestType: InterestType;
  percentage: number;
  effectiveDate: Date;
  endDate?: Date;
  costBearing: boolean;
  decisionMaking: boolean;
}
```

### JIB Calculation Framework

```typescript
// Joint Interest Billing service
@Injectable()
export class JIBService {
  async calculateJIBStatement(
    leaseId: string,
    billingPeriod: DateRange,
  ): Promise<JIBStatement> {
    // Get lease partnerships
    const partnerships = await this.getLeasePartnerships(leaseId);

    // Get production and revenue data
    const production = await this.getProductionData(leaseId, billingPeriod);
    const revenue = await this.calculateRevenue(production);

    // Get operating expenses
    const expenses = await this.getOperatingExpenses(leaseId, billingPeriod);

    // Calculate partner distributions
    const distributions = this.calculateDistributions(
      partnerships,
      revenue,
      expenses,
    );

    return {
      leaseId,
      billingPeriod,
      partnerships,
      revenue,
      expenses,
      distributions,
      netDistributions: this.calculateNetDistributions(distributions),
    };
  }

  private calculateDistributions(
    partnerships: LeasePartnership[],
    revenue: Revenue,
    expenses: Expense[],
  ): PartnerDistribution[] {
    return partnerships.map((partnership) => {
      const revenueShare = revenue.total * (partnership.percentage / 100);
      const expenseShare = partnership.costBearing
        ? this.calculateExpenseShare(expenses, partnership.percentage)
        : 0;

      return {
        partnerId: partnership.partnerId,
        percentage: partnership.percentage,
        revenueShare,
        expenseShare,
        netDistribution: revenueShare - expenseShare,
      };
    });
  }
}
```

### Partner Portal Authentication

```typescript
// Partner portal access control
interface PartnerPortalAccess {
  partnerId: string;
  accessLevel: "read_only" | "limited" | "full";
  allowedLeases: string[];
  allowedDocuments: DocumentType[];
  expirationDate?: Date;
}

@Injectable()
export class PartnerPortalService {
  async authenticatePartner(
    email: string,
    password: string,
  ): Promise<PartnerSession> {
    const partner = await this.validatePartnerCredentials(email, password);
    const access = await this.getPartnerAccess(partner.id);

    return {
      partnerId: partner.id,
      companyName: partner.companyName,
      accessLevel: access.accessLevel,
      allowedLeases: access.allowedLeases,
      sessionToken: this.generateSessionToken(partner.id),
    };
  }
}
```

## Acceptance Criteria

### Partner Management

- [ ] Partners can be registered with complete information
- [ ] Multiple contacts per partner are supported
- [ ] Partner status and classification work correctly
- [ ] Contact management includes communication preferences
- [ ] Partner search and filtering function properly

### Ownership Management

- [ ] Working interest percentages can be assigned and tracked
- [ ] Ownership changes maintain effective date history
- [ ] Interest validation ensures 100% allocation
- [ ] Multiple interest types are supported per partner
- [ ] Ownership reports generate accurately

### Basic JIB Framework

- [ ] JIB data models support standard billing scenarios
- [ ] Cost allocation methods work for different scenarios
- [ ] Revenue sharing calculations are accurate
- [ ] Billing periods and frequencies are configurable
- [ ] JIB statements generate with correct data

### Partner Communication

- [ ] Document sharing restricts access appropriately
- [ ] Partner notifications deliver successfully
- [ ] Communication history is tracked and searchable
- [ ] Document versioning maintains access control
- [ ] Bulk communication tools work efficiently

### Partner Portal

- [ ] Partners can login and access their dashboard
- [ ] Ownership information displays accurately
- [ ] Production reports show partner-specific data
- [ ] Document downloads work with proper security
- [ ] Portal access controls enforce restrictions

## Team Assignments

### Backend Lead Developer

- Partner management system architecture
- JIB calculation framework
- Ownership tracking and validation
- Partner portal authentication

### Backend Developer

- Partner data models and API endpoints
- Document sharing and access control
- Notification system integration
- JIB statement generation

### Frontend Developer

- Partner management interface
- Ownership editing and tracking UI
- Partner portal dashboard
- Document sharing interface

### Business Analyst

- JIB requirements and calculations
- Partner workflow documentation
- Ownership structure validation
- Industry standard compliance

## Dependencies

### From Previous Sprints

- ✅ User management and authentication
- ✅ Lease and well management
- ✅ Production data system
- ✅ Document management foundation

### External Dependencies

- Banking integration for ACH payments (future)
- Document storage and security
- Email delivery for partner communications
- PDF generation for statements

## Partner Portal Design

### Partner Dashboard

```
┌─────────────────────────────────────────────────────┐
│ Welcome, ABC Energy Partners                        │
├─────────────────────────────────────────────────────┤
│ Your Interests                                      │
│ ┌─────────────┬─────────────┬─────────────────────┐ │
│ │ Lease       │ Interest %  │ Type                │ │
│ │ Smith #1    │ 25.0%      │ Working Interest    │ │
│ │ Jones Lease │ 12.5%      │ Royalty Interest    │ │
│ └─────────────┴─────────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Recent Activity                                     │
│ • JIB Statement - March 2024 (Available)           │
│ • Production Report - March 2024 (New)             │
│ • Operating Agreement Amendment (Pending Review)    │
├─────────────────────────────────────────────────────┤
│ Quick Actions                                       │
│ [View Statements] [Download Reports] [Contact Us]   │
└─────────────────────────────────────────────────────┘
```

### JIB Statement Preview

```
┌─────────────────────────────────────────────────────┐
│ Joint Interest Billing Statement                    │
│ Smith Lease - March 2024                           │
├─────────────────────────────────────────────────────┤
│ Partner: ABC Energy Partners (25.0% WI)            │
├─────────────────────────────────────────────────────┤
│ REVENUE                                             │
│ Oil Sales (1,234 BBL @ $75.00)      $92,550.00    │
│ Gas Sales (5,678 MCF @ $3.50)       $19,873.00    │
│ Your Share (25.0%)                  $28,105.75     │
├─────────────────────────────────────────────────────┤
│ EXPENSES                                            │
│ Lease Operating Expense              $15,000.00    │
│ Workover Costs                       $8,500.00     │
│ Your Share (25.0%)                   $5,875.00     │
├─────────────────────────────────────────────────────┤
│ NET DISTRIBUTION                     $22,230.75     │
└─────────────────────────────────────────────────────┘
```

## Ownership Validation

### Interest Balancing

```typescript
// Ownership validation service
@Injectable()
export class OwnershipValidationService {
  async validateLeaseOwnership(leaseId: string): Promise<ValidationResult> {
    const partnerships = await this.getLeasePartnerships(leaseId);

    // Group by interest type
    const workingInterest = partnerships
      .filter((p) => p.interestType === InterestType.WORKING_INTEREST)
      .reduce((sum, p) => sum + p.percentage, 0);

    const royaltyInterest = partnerships
      .filter((p) => p.interestType === InterestType.ROYALTY_INTEREST)
      .reduce((sum, p) => sum + p.percentage, 0);

    const errors: ValidationError[] = [];

    // Working interest should total 100%
    if (Math.abs(workingInterest - 100) > 0.01) {
      errors.push({
        type: "working_interest_imbalance",
        message: `Working interest totals ${workingInterest}%, should be 100%`,
      });
    }

    // Royalty interest should not exceed 25% (typical)
    if (royaltyInterest > 25) {
      errors.push({
        type: "high_royalty_interest",
        message: `Royalty interest ${royaltyInterest}% exceeds typical maximum`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      workingInterestTotal: workingInterest,
      royaltyInterestTotal: royaltyInterest,
    };
  }
}
```

## Performance Requirements

### Partner Management

- Partner list loads: < 2 seconds for 100+ partners
- Ownership calculations: < 1 second for complex structures
- JIB statement generation: < 10 seconds for monthly data
- Partner portal loads: < 3 seconds for dashboard

### Document Access

- Document sharing permissions: < 500ms validation
- File downloads: Start within 2 seconds
- Bulk operations: < 30 seconds for 50+ partners
- Search functionality: < 1 second response time

## Risks & Mitigation

### Business Risks

- **Ownership calculation errors**: Extensive validation and testing
- **Partner access security**: Robust authentication and authorization
- **JIB calculation disputes**: Clear audit trails and documentation

### Technical Risks

- **Complex ownership structures**: Start simple, add complexity gradually
- **Performance with many partners**: Optimize queries and caching
- **Document security**: Implement proper access controls

### Compliance Risks

- **Regulatory reporting**: Ensure JIB calculations meet standards
- **Audit requirements**: Maintain comprehensive audit trails
- **Tax implications**: Validate calculations with accounting experts

## Definition of Done

### Functional Requirements

- [ ] Partner management system handles all partner types
- [ ] Ownership tracking maintains accurate percentages
- [ ] Basic JIB calculations produce correct results
- [ ] Partner portal provides secure access to information
- [ ] Document sharing enforces proper access controls

### Quality Requirements

- [ ] Ownership validation prevents imbalanced interests
- [ ] JIB calculations validated against manual calculations
- [ ] Security testing verifies partner access controls
- [ ] Performance testing meets requirements
- [ ] User acceptance testing completed

### Business Requirements

- [ ] JIB calculations reviewed by industry expert
- [ ] Partner workflows match industry standards
- [ ] Ownership structures support common scenarios
- [ ] Communication tools meet partner needs
- [ ] Audit trails satisfy regulatory requirements

## Success Metrics

- **Ownership Accuracy**: 100% balanced working interest allocations
- **JIB Calculation Accuracy**: 99%+ accuracy vs manual calculations
- **Partner Portal Usage**: 70%+ of partners access portal monthly
- **Document Sharing Efficiency**: 50%+ reduction in manual distribution
- **Partner Satisfaction**: Positive feedback on portal and communications

## Next Sprint Preparation

- Advanced JIB calculations and statement generation
- Revenue distribution and payment processing
- Cost allocation methodologies
- Partner payment and banking integration

---

**Sprint 11 establishes the partner management foundation that enables Joint
Interest Billing automation. Accurate ownership tracking and partner
communication are essential for operational efficiency.**
