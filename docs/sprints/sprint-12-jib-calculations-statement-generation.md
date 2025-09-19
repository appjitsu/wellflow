# Sprint 13: JIB Calculations & Statement Generation

## Sprint Overview

**Duration:** 3 weeks  
**Story Points:** 15 points  
**Sprint Goal:** Implement comprehensive Joint Interest Billing calculations,
automated statement generation, and revenue distribution processing.

## Sprint Objectives

1. Build advanced JIB calculation engine with multiple allocation methods
2. Implement automated JIB statement generation and formatting
3. Create revenue distribution and payment processing system
4. Develop cost allocation and expense management
5. Build JIB approval workflow and partner distribution

## Deliverables

### 1. Advanced JIB Calculation Engine

- **Revenue Calculations**
  - Oil and gas sales revenue allocation
  - Price differential and transportation deductions
  - Marketing and processing fee calculations
  - Royalty and overriding royalty distributions
- **Cost Allocation Methods**
  - Per-well allocation for direct costs
  - Per-lease allocation for shared costs
  - AFE (Authorization for Expenditure) based allocation
  - Custom allocation formulas

### 2. Statement Generation System

- **JIB Statement Templates**
  - Professional PDF statement generation
  - Customizable statement formats
  - Multi-page statement handling
  - Partner-specific statement variations
- **Statement Content**
  - Revenue breakdown by commodity
  - Detailed expense itemization
  - Net distribution calculations
  - Year-to-date summaries

### 3. Revenue Distribution Processing

- **Distribution Calculations**
  - Net revenue after expenses and deductions
  - Partner-specific distribution amounts
  - Payment scheduling and timing
  - Distribution approval workflows
- **Payment Processing**
  - ACH payment integration
  - Check printing and mailing
  - Payment tracking and reconciliation
  - Failed payment handling

### 4. Expense Management

- **Operating Expense Tracking**
  - Vendor invoice processing
  - Expense categorization and coding
  - Cost center allocation
  - Expense approval workflows
- **Capital Expenditure Handling**
  - AFE creation and tracking
  - Capital cost allocation
  - Depreciation and depletion calculations
  - Partner approval requirements

### 5. JIB Workflow Management

- **Statement Review Process**
  - Pre-generation validation
  - Statement review and approval
  - Partner notification and distribution
  - Statement revision handling
- **Audit and Compliance**
  - Complete audit trail maintenance
  - Regulatory compliance checking
  - Partner dispute resolution
  - Historical statement access

## Technical Requirements

### JIB Calculation Engine

```typescript
// Advanced JIB calculation service
@Injectable()
export class AdvancedJIBService {
  async generateJIBStatement(
    leaseId: string,
    billingPeriod: DateRange,
    options: JIBOptions
  ): Promise<JIBStatement> {
    // Get all required data
    const partnerships = await this.getLeasePartnerships(leaseId);
    const production = await this.getProductionData(leaseId, billingPeriod);
    const sales = await this.getSalesData(leaseId, billingPeriod);
    const expenses = await this.getExpenses(leaseId, billingPeriod);

    // Calculate revenue distributions
    const revenueDistributions = await this.calculateRevenueDistributions(
      partnerships,
      sales,
      options.revenueAllocationMethod
    );

    // Calculate expense allocations
    const expenseAllocations = await this.calculateExpenseAllocations(
      partnerships,
      expenses,
      options.expenseAllocationMethod
    );

    // Calculate net distributions
    const netDistributions = this.calculateNetDistributions(
      revenueDistributions,
      expenseAllocations
    );

    return {
      leaseId,
      billingPeriod,
      partnerships,
      production,
      sales,
      expenses,
      revenueDistributions,
      expenseAllocations,
      netDistributions,
      generatedAt: new Date(),
      status: JIBStatus.DRAFT,
    };
  }

  private async calculateRevenueDistributions(
    partnerships: LeasePartnership[],
    sales: SalesData[],
    method: RevenueAllocationMethod
  ): Promise<RevenueDistribution[]> {
    const distributions: RevenueDistribution[] = [];

    for (const partnership of partnerships) {
      const grossRevenue = this.calculateGrossRevenue(sales);
      const deductions = this.calculateDeductions(sales, partnership);
      const netRevenue = grossRevenue - deductions;

      // Apply working interest percentage
      const workingInterestShare = netRevenue * (partnership.percentage / 100);

      // Calculate royalty burden
      const royaltyBurden = this.calculateRoyaltyBurden(
        workingInterestShare,
        partnership.royaltyRate || 0
      );

      const netRevenueInterest = workingInterestShare - royaltyBurden;

      distributions.push({
        partnerId: partnership.partnerId,
        grossRevenue: workingInterestShare,
        deductions,
        royaltyBurden,
        netRevenueInterest,
        details: this.buildRevenueDetails(sales, partnership),
      });
    }

    return distributions;
  }
}
```

### Statement Generation

```typescript
// JIB statement PDF generation
@Injectable()
export class JIBStatementPDFService {
  async generateStatement(
    statement: JIBStatement,
    template: StatementTemplate
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });

    // Header with company information
    this.addHeader(doc, statement, template);

    // Statement period and partner information
    this.addStatementInfo(doc, statement);

    // Revenue section
    this.addRevenueSection(doc, statement.revenueDistributions);

    // Expense section
    this.addExpenseSection(doc, statement.expenseAllocations);

    // Net distribution summary
    this.addDistributionSummary(doc, statement.netDistributions);

    // Year-to-date summary
    this.addYTDSummary(doc, statement);

    // Footer with payment information
    this.addFooter(doc, statement);

    return doc;
  }

  private addRevenueSection(
    doc: PDFDocument,
    distributions: RevenueDistribution[]
  ): void {
    doc.fontSize(14).text('REVENUE', 50, doc.y + 20);
    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();

    distributions.forEach(dist => {
      dist.details.forEach(detail => {
        doc
          .fontSize(10)
          .text(detail.description, 70, doc.y + 10)
          .text(this.formatCurrency(detail.amount), 450, doc.y, {
            align: 'right',
          });
      });
    });
  }
}
```

### Payment Processing Integration

```typescript
// Payment processing service
@Injectable()
export class PaymentProcessingService {
  async processDistributions(
    distributions: NetDistribution[],
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult[]> {
    const results: PaymentResult[] = [];

    for (const distribution of distributions) {
      if (distribution.amount <= 0) {
        // Handle partner owes money scenario
        results.push(await this.handlePartnerDebt(distribution));
        continue;
      }

      try {
        let paymentResult: PaymentResult;

        switch (paymentMethod) {
          case PaymentMethod.ACH:
            paymentResult = await this.processACHPayment(distribution);
            break;
          case PaymentMethod.CHECK:
            paymentResult = await this.generateCheck(distribution);
            break;
          case PaymentMethod.WIRE:
            paymentResult = await this.processWireTransfer(distribution);
            break;
          default:
            throw new Error(`Unsupported payment method: ${paymentMethod}`);
        }

        results.push(paymentResult);
      } catch (error) {
        results.push({
          distributionId: distribution.id,
          status: PaymentStatus.FAILED,
          error: error.message,
          retryable: true,
        });
      }
    }

    return results;
  }
}
```

## Acceptance Criteria

### JIB Calculations

- [ ] Revenue calculations handle all commodity types
- [ ] Expense allocations support multiple methods
- [ ] Royalty burden calculations are accurate
- [ ] Deductions and fees calculate correctly
- [ ] Net distributions balance to zero across all partners
- [ ] Year-to-date calculations accumulate properly

### Statement Generation

- [ ] PDF statements format professionally
- [ ] All calculation details are clearly presented
- [ ] Partner-specific information displays correctly
- [ ] Multi-page statements handle pagination properly
- [ ] Statement templates are customizable
- [ ] Generated statements match manual calculations

### Revenue Distribution

- [ ] Distribution calculations are mathematically correct
- [ ] Payment processing integrates with banking systems
- [ ] Failed payments are handled and retried appropriately
- [ ] Payment tracking maintains complete audit trail
- [ ] Distribution approval workflow prevents unauthorized payments

### Expense Management

- [ ] Operating expenses allocate correctly by method
- [ ] Capital expenditures follow AFE allocations
- [ ] Expense categories and coding work properly
- [ ] Vendor invoice processing handles various formats
- [ ] Expense approval workflows enforce business rules

### Workflow Management

- [ ] Statement review process maintains quality control
- [ ] Partner notifications deliver statements reliably
- [ ] Statement revisions maintain version history
- [ ] Audit trail captures all JIB activities
- [ ] Dispute resolution process tracks issues

## Team Assignments

### Backend Lead Developer

- Advanced JIB calculation engine
- Revenue distribution algorithms
- Payment processing integration
- Expense allocation methods

### Backend Developer

- Statement generation system
- PDF formatting and templates
- Database schema for JIB data
- Background job processing

### Frontend Developer

- JIB statement review interface
- Expense management UI
- Payment processing dashboard
- Partner distribution interface

### Accounting Consultant

- JIB calculation validation
- Industry standard compliance
- Expense allocation methods
- Payment processing requirements

## Dependencies

### From Previous Sprints

- ✅ Partner management system
- ✅ Basic JIB framework
- ✅ Production and sales data
- ✅ Document generation system

### External Dependencies

- Banking/ACH processing provider
- Check printing service
- PDF generation libraries
- Accounting system integration

## JIB Statement Template

### Statement Layout

```
┌─────────────────────────────────────────────────────┐
│ JOINT INTEREST BILLING STATEMENT                    │
│ Operator: WellFlow Energy                           │
│ Statement Date: March 31, 2024                     │
├─────────────────────────────────────────────────────┤
│ Partner: ABC Energy Partners                        │
│ Working Interest: 25.0%                             │
│ Lease: Smith #1 Lease                              │
│ Statement Period: March 1-31, 2024                 │
├─────────────────────────────────────────────────────┤
│ REVENUE                                             │
│ Oil Sales: 1,234 BBL @ $75.00/BBL    $92,550.00   │
│   Your Share (25.0%)                  $23,137.50   │
│ Gas Sales: 5,678 MCF @ $3.50/MCF     $19,873.00   │
│   Your Share (25.0%)                   $4,968.25   │
│ Total Gross Revenue                   $28,105.75   │
│                                                     │
│ DEDUCTIONS                                          │
│ Transportation                           $450.00    │
│ Processing Fees                          $275.00    │
│ Marketing Fees                           $125.00    │
│ Total Deductions                         $850.00    │
│                                                     │
│ Net Revenue Interest                  $27,255.75    │
├─────────────────────────────────────────────────────┤
│ EXPENSES                                            │
│ Lease Operating Expense               $3,750.00    │
│ Workover - Well #1                   $2,125.00    │
│ Equipment Rental                        $500.00    │
│ Total Expenses                        $6,375.00    │
├─────────────────────────────────────────────────────┤
│ NET DISTRIBUTION                     $20,880.75    │
│                                                     │
│ Payment Method: ACH Transfer                        │
│ Payment Date: April 15, 2024                       │
└─────────────────────────────────────────────────────┘
```

## Calculation Validation

### Revenue Distribution Validation

```typescript
// Validation service for JIB calculations
@Injectable()
export class JIBValidationService {
  async validateJIBStatement(
    statement: JIBStatement
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Validate revenue distributions sum to total revenue
    const totalRevenue = statement.sales.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );
    const distributedRevenue = statement.revenueDistributions.reduce(
      (sum, dist) => sum + dist.grossRevenue,
      0
    );

    if (Math.abs(totalRevenue - distributedRevenue) > 0.01) {
      errors.push({
        type: 'revenue_distribution_mismatch',
        message: `Revenue distribution ${distributedRevenue} doesn't match total revenue ${totalRevenue}`,
      });
    }

    // Validate expense allocations sum to total expenses
    const totalExpenses = statement.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const allocatedExpenses = statement.expenseAllocations.reduce(
      (sum, alloc) => sum + alloc.totalAllocation,
      0
    );

    if (Math.abs(totalExpenses - allocatedExpenses) > 0.01) {
      errors.push({
        type: 'expense_allocation_mismatch',
        message: `Expense allocation ${allocatedExpenses} doesn't match total expenses ${totalExpenses}`,
      });
    }

    // Validate working interest percentages
    const totalWI = statement.partnerships.reduce(
      (sum, p) => sum + p.percentage,
      0
    );

    if (Math.abs(totalWI - 100) > 0.01) {
      errors.push({
        type: 'working_interest_imbalance',
        message: `Working interest totals ${totalWI}%, should be 100%`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(statement),
    };
  }
}
```

## Performance Requirements

### Calculation Performance

- JIB statement generation: < 15 seconds for complex leases
- Revenue distribution calculations: < 5 seconds per statement
- Expense allocation processing: < 3 seconds per statement
- PDF generation: < 10 seconds per statement
- Batch processing: 100+ statements per hour

### Payment Processing

- ACH payment processing: < 30 seconds per transaction
- Payment status updates: Real-time processing
- Failed payment retry: Within 1 hour
- Payment reconciliation: Daily batch processing

## Risks & Mitigation

### Financial Risks

- **Calculation errors**: Extensive validation and testing
- **Payment processing failures**: Robust error handling and retry logic
- **Regulatory compliance**: Industry expert review and validation

### Technical Risks

- **Complex calculations**: Modular design with unit testing
- **Performance with large datasets**: Optimize queries and use caching
- **Integration failures**: Fallback procedures and manual processing

### Business Risks

- **Partner disputes**: Clear audit trails and detailed statements
- **Cash flow issues**: Accurate and timely distribution processing
- **Compliance violations**: Regular review of calculation methods

## Definition of Done

### Functional Requirements

- [ ] JIB calculations produce accurate results for all scenarios
- [ ] Statement generation creates professional, detailed statements
- [ ] Payment processing handles all supported methods
- [ ] Expense allocation supports required methods
- [ ] Workflow management maintains proper controls

### Quality Requirements

- [ ] Calculations validated against manual calculations
- [ ] Statement formatting reviewed by industry experts
- [ ] Payment processing tested with banking partners
- [ ] Performance testing meets requirements
- [ ] Security review completed for financial data

### Business Requirements

- [ ] JIB statements meet industry standards
- [ ] Calculation methods comply with operating agreements
- [ ] Payment processing meets banking regulations
- [ ] Audit trails satisfy regulatory requirements
- [ ] Partner approval process enforces business rules

## Success Metrics

- **Calculation Accuracy**: 99.9%+ accuracy vs manual calculations
- **Statement Generation Speed**: < 15 seconds per statement
- **Payment Success Rate**: 98%+ successful payment processing
- **Partner Satisfaction**: Positive feedback on statement clarity
- **Time Savings**: 80%+ reduction in JIB preparation time

## Next Sprint Preparation

- Data validation and quality control systems
- Advanced error detection and correction
- Automated data quality reporting
- Integration testing and system validation

---

**Sprint 12 completes the JIB automation that provides significant value to
operators. Accurate calculations and professional statements eliminate manual
JIB preparation and reduce partner disputes.**
