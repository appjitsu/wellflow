# Division Orders & Revenue Distribution System Requirements

## Executive Summary

The Division Orders & Revenue Distribution System is a critical component of
WellFlow that manages the complex process of calculating and distributing oil &
gas revenue to interest owners. This system ensures accurate decimal interest
calculations, regulatory compliance, and timely revenue payments to partners and
royalty owners.

## Business Context

### What are Division Orders?

Division Orders are legal instruments that:

- Document each interest owner's decimal interest in a well
- Authorize operators to distribute revenue based on ownership percentages
- Establish the legal framework for revenue payments
- Provide audit trails for regulatory compliance

### Revenue Distribution Process

1. **Production Data Collection**: Monthly oil and gas production volumes
2. **Price Determination**: Market prices for oil and gas sales
3. **Gross Revenue Calculation**: Volume × Price = Gross Revenue
4. **Deductions Processing**: Taxes, transportation, processing costs
5. **Net Revenue Calculation**: Gross Revenue - Deductions = Net Revenue
6. **Interest Distribution**: Net Revenue × Decimal Interest = Owner Payment
7. **Payment Processing**: Generate checks/ACH payments to owners

## Functional Requirements

### FR-1: Division Order Management

#### FR-1.1: Create Division Orders

- **Description**: System must allow creation of division orders for well
  interest owners
- **Inputs**: Well ID, Partner ID, Decimal Interest, Effective Date
- **Business Rules**:
  - Decimal interest must be between 0.00000001 and 1.00000000 (8 decimal
    precision)
  - Sum of all decimal interests for a well cannot exceed 1.0
  - Effective date cannot be in the future
  - Only one active division order per partner-well combination
- **Outputs**: Division Order ID, confirmation of creation

#### FR-1.2: Update Division Orders

- **Description**: System must support updating division orders for interest
  changes
- **Business Rules**:
  - Updates create new division order with new effective date
  - Previous division order is end-dated
  - Maintains complete audit trail of changes
- **Validation**: New decimal interest must pass sum validation

#### FR-1.3: Validate Decimal Interest Totals

- **Description**: System must ensure decimal interests sum correctly
- **Business Rules**:
  - Total decimal interests per well must equal 1.0 (within 0.00000001
    tolerance)
  - System alerts when totals don't balance
  - Prevents revenue distribution until balanced

### FR-2: Revenue Calculation Engine

#### FR-2.1: Monthly Revenue Processing

- **Description**: Calculate monthly revenue distributions for all wells
- **Inputs**: Production data, commodity prices, deduction information
- **Process**:
  1. Retrieve production volumes for month
  2. Apply current commodity prices
  3. Calculate gross revenue (oil + gas)
  4. Apply deductions (taxes, costs)
  5. Calculate net revenue
  6. Distribute to owners based on decimal interests

#### FR-2.2: Deduction Processing

- **Description**: Apply various deductions to gross revenue
- **Deduction Types**:
  - **Severance Tax**: State-specific tax rates
  - **Ad Valorem Tax**: Property taxes on production
  - **Transportation Costs**: Pipeline and trucking fees
  - **Processing Costs**: Gas processing and oil treating
  - **Other Deductions**: Marketing fees, compression costs

#### FR-2.3: Multi-Product Revenue Handling

- **Description**: Handle oil and gas revenue separately with different pricing
- **Business Rules**:
  - Oil revenue: Volume (bbls) × Oil Price ($/bbl)
  - Gas revenue: Volume (mcf) × Gas Price ($/mcf)
  - Separate deductions may apply to each product type

### FR-3: Payment Processing

#### FR-3.1: Revenue Statement Generation

- **Description**: Generate detailed revenue statements for interest owners
- **Content Requirements**:
  - Production volumes (oil/gas)
  - Commodity prices
  - Gross revenue calculation
  - Itemized deductions
  - Net revenue and payment amount
  - Check number and payment date
  - Year-to-date totals

#### FR-3.2: Payment Distribution

- **Description**: Process payments to interest owners
- **Payment Methods**:
  - Physical checks
  - ACH/Electronic transfers
  - Wire transfers (for large amounts)
- **Business Rules**:
  - Minimum payment thresholds
  - Suspended payments for disputed interests
  - Escrow handling for unresolved ownership

### FR-4: Compliance and Reporting

#### FR-4.1: Regulatory Compliance

- **Description**: Ensure compliance with state and federal regulations
- **Requirements**:
  - Maintain detailed audit trails
  - Support regulatory reporting (Form 1099-MISC)
  - Handle escheatment for unclaimed payments
  - Comply with state-specific payment timing requirements

#### FR-4.2: Audit Trail Management

- **Description**: Maintain complete audit trails for all transactions
- **Tracked Information**:
  - Division order changes with timestamps
  - Revenue calculation details
  - Payment processing records
  - User actions and approvals

## Non-Functional Requirements

### NFR-1: Performance

- Revenue calculations must complete within 5 minutes for 1000 wells
- System must support concurrent processing of multiple months
- Database queries must execute within 2 seconds for typical operations

### NFR-2: Accuracy

- Financial calculations must be accurate to 2 decimal places
- Decimal interest calculations must maintain 8 decimal precision
- Revenue totals must balance within $0.01 tolerance

### NFR-3: Security

- Multi-tenant data isolation using Row Level Security
- Role-based access control for division order management
- Audit logging for all financial transactions
- Encryption for sensitive financial data

### NFR-4: Scalability

- Support for 10,000+ wells per organization
- Handle 100,000+ interest owners
- Process monthly revenue for all wells within 24 hours

## Data Model Requirements

### Division Orders Entity

```typescript
interface DivisionOrder {
  id: string;
  organizationId: string;
  wellId: string;
  partnerId: string;
  decimalInterest: number; // 8 decimal precision
  effectiveDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Revenue Distribution Entity

```typescript
interface RevenueDistribution {
  id: string;
  organizationId: string;
  wellId: string;
  partnerId: string;
  divisionOrderId: string;
  productionMonth: Date;
  oilVolume?: number;
  gasVolume?: number;
  oilRevenue?: number;
  gasRevenue?: number;
  totalRevenue: number;
  severanceTax?: number;
  adValorem?: number;
  transportationCosts?: number;
  processingCosts?: number;
  otherDeductions?: number;
  netRevenue: number;
  checkNumber?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Requirements

### INT-1: Production Data Integration

- Integration with production data entry system
- Real-time updates when production data changes
- Validation of production data completeness

### INT-2: Pricing Integration

- Integration with commodity pricing services
- Support for manual price overrides
- Historical price tracking and adjustments

### INT-3: Accounting System Integration

- Export revenue distributions to QuickBooks
- Generate journal entries for accounting
- Support for multiple chart of accounts

## User Stories

### US-1: Division Order Analyst

**As a** division order analyst  
**I want to** create and manage division orders for well interest owners  
**So that** revenue can be accurately distributed based on ownership interests

### US-2: Revenue Accountant

**As a** revenue accountant  
**I want to** process monthly revenue distributions  
**So that** interest owners receive timely and accurate payments

### US-3: Interest Owner

**As an** interest owner  
**I want to** view my revenue statements and payment history  
**So that** I can track my oil and gas income

### US-4: Compliance Officer

**As a** compliance officer  
**I want to** generate regulatory reports and audit trails  
**So that** the organization meets all compliance requirements

## Success Criteria

1. **Accuracy**: 99.9% accuracy in revenue calculations
2. **Timeliness**: Monthly revenue processing completed within 5 business days
3. **Compliance**: Zero regulatory violations or penalties
4. **User Satisfaction**: 95% user satisfaction rating
5. **System Reliability**: 99.9% uptime during business hours

## Risk Mitigation

### Financial Risk

- Implement dual approval process for large payments
- Daily reconciliation of revenue calculations
- Automated balance validation checks

### Compliance Risk

- Regular compliance audits and reviews
- Automated regulatory report generation
- Legal review of division order templates

### Operational Risk

- Comprehensive backup and recovery procedures
- Redundant calculation validation
- User training and documentation

This requirements document provides the foundation for implementing a robust
Division Orders & Revenue Distribution System that meets the complex needs of
oil & gas operations while ensuring accuracy, compliance, and efficiency.
