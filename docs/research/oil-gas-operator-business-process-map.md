# Oil & Gas Small Operator Business Process Map (Current State)

**Document Version**: 1.0  
**Date**: January 2025  
**Scope**: Small to Micro Oil & Gas Operators (1-100 wells)  
**Purpose**: Document current business processes and workflows without
automation

## Executive Summary

This document maps the complete business operations of small oil & gas operators
as they function today, primarily using manual processes, paper-based systems,
and basic digital tools like Excel. Understanding these current workflows is
essential for identifying automation opportunities and pain points.

## Table of Contents

1. [Organizational Structure](#organizational-structure)
2. [Daily Operations Workflow](#daily-operations-workflow)
3. [Monthly Business Cycles](#monthly-business-cycles)
4. [Production Management Process](#production-management-process)
5. [Financial Management Process](#financial-management-process)
6. [Regulatory Compliance Process](#regulatory-compliance-process)
7. [Partner & Stakeholder Management](#partner--stakeholder-management)
8. [Maintenance & Service Management](#maintenance--service-management)
9. [Information Flow & Communication](#information-flow--communication)
10. [Decision-Making Processes](#decision-making-processes)

## Organizational Structure

### Typical Small Operator Organization (10-50 wells)

```mermaid
graph TB
    Owner["Owner/President<br/>Strategic Decisions<br/>Banking & Financing<br/>Major Contracts"]

    Owner --> FieldSup["Field Supervisor<br/>Operations Management<br/>Safety Oversight<br/>Vendor Coordination"]
    Owner --> OfficeMgr["Office Manager<br/>Accounting<br/>Compliance<br/>Administration"]

    FieldSup --> Pumper1["Contract Pumper #1<br/>15-25 wells/day<br/>Data Collection<br/>Basic Maintenance"]
    FieldSup --> Pumper2["Contract Pumper #2<br/>15-25 wells/day<br/>Data Collection<br/>Basic Maintenance"]
    FieldSup --> ServiceCo["Service Companies<br/>Workover Crews<br/>Transport<br/>Specialized Services"]

    OfficeMgr --> Admin["Administrative Assistant<br/>Data Entry<br/>Filing<br/>Phone/Email"]
    OfficeMgr --> Accountant["Part-time Accountant<br/>JIB Statements<br/>Tax Preparation<br/>Financial Reports"]

    style Owner fill:#f9f,stroke:#333,stroke-width:4px
    style FieldSup fill:#bbf,stroke:#333,stroke-width:2px
    style OfficeMgr fill:#bbf,stroke:#333,stroke-width:2px
```

### Micro Operator Organization (1-10 wells)

```mermaid
graph TB
    OwnerOp["Owner-Operator<br/>All Strategic Decisions<br/>Field Operations<br/>Office Functions"]

    OwnerOp --> ContractPumper["Contract Pumper<br/>Daily Rounds<br/>All Wells"]
    OwnerOp --> Bookkeeper["Part-time Bookkeeper<br/>Monthly Books<br/>Reports"]
    OwnerOp --> Services["On-demand Services<br/>Workover<br/>Transport<br/>Repairs"]

    style OwnerOp fill:#f9f,stroke:#333,stroke-width:4px
```

## Daily Operations Workflow

### Field Operations Daily Cycle

```mermaid
flowchart LR
    Start([5:00 AM Start]) --> Route[Plan Daily Route<br/>Review Yesterday's Issues]
    Route --> Drive1[Drive to First Well<br/>30-45 minutes]
    Drive1 --> Inspect1[Visual Inspection<br/>Check Equipment]
    Inspect1 --> Measure1[Read Gauges<br/>Record on Paper Ticket]
    Measure1 --> Maint1[Minor Maintenance<br/>Add Chemicals]
    Maint1 --> Photo1[Take Photos<br/>if Issues]
    Photo1 --> NextWell{More Wells?}
    NextWell -->|Yes| Drive2[Drive to Next Well<br/>15-20 minutes]
    Drive2 --> Inspect1
    NextWell -->|No| Return[Return to Office<br/>or Home]
    Return --> Submit[Submit Paper Tickets<br/>Report Issues]
    Submit --> End([End of Day])

    style Start fill:#90EE90
    style End fill:#FFB6C1
```

### Office Operations Daily Cycle

```mermaid
flowchart TB
    Morning([8:00 AM Start]) --> Email[Check Emails<br/>Voicemails]
    Email --> Tickets[Receive Field Tickets<br/>via Text/Email/Drop-off]
    Tickets --> Entry[Manual Data Entry<br/>Into Excel]
    Entry --> Validate[Validate Production<br/>Check for Anomalies]
    Validate --> Issues{Issues Found?}
    Issues -->|Yes| CallField[Call Field Supervisor<br/>Discuss Problems]
    Issues -->|No| Continue[Continue Processing]
    CallField --> Continue
    Continue --> Invoices[Process Vendor Invoices<br/>Match to Work Orders]
    Invoices --> Approve[Route for Approval<br/>Via Email/Paper]
    Approve --> Filing[File Documents<br/>Physical & Digital]
    Filing --> Reports[Prepare Reports<br/>If Due]
    Reports --> EndDay([5:00 PM End])

    style Morning fill:#90EE90
    style EndDay fill:#FFB6C1
```

## Monthly Business Cycles

### Week-by-Week Monthly Operations

```mermaid
gantt
    title Monthly Operations Schedule
    dateFormat  YYYY-MM-DD
    section Week 1
    Gather Production Data          :done, w1-1, 2025-01-01, 2d
    Calculate Revenue               :done, w1-2, after w1-1, 2d
    Prepare Form PR                 :done, w1-3, after w1-2, 2d
    Submit to Texas RRC             :crit, w1-4, after w1-3, 1d

    section Week 2
    Process Invoices                :done, w2-1, 2025-01-08, 3d
    Calculate JIB Allocations       :done, w2-2, after w2-1, 2d
    Generate Partner Statements     :done, w2-3, after w2-2, 2d
    Mail/Email Statements          :crit, w2-4, after w2-3, 1d

    section Week 3
    Review Operating Costs          :done, w3-1, 2025-01-15, 2d
    Plan Maintenance Schedule       :done, w3-2, after w3-1, 2d
    Order Supplies/Chemicals        :done, w3-3, after w3-2, 2d
    Safety Meeting                  :crit, w3-4, after w3-3, 1d

    section Week 4
    Reconcile Bank Accounts         :done, w4-1, 2025-01-22, 2d
    Pay Vendors                     :done, w4-2, after w4-1, 2d
    Compliance Review               :done, w4-3, after w4-2, 2d
    Month-End Close                 :crit, w4-4, after w4-3, 2d
```

## Production Management Process

### Daily Production Data Flow

```mermaid
flowchart TD
    Well[Well Site] --> Pumper[Pumper Reads Gauges]
    Pumper --> Ticket[Paper Run Ticket<br/>Oil: Tank Levels<br/>Gas: Meter Readings<br/>Water: Disposal Volume]
    Ticket --> Submit{Submission Method}
    Submit -->|Text Photo| Phone[Smartphone Photo]
    Submit -->|Physical| DropBox[Office Drop Box]
    Submit -->|Call| PhoneCall[Phone Call]

    Phone --> DataEntry[Manual Data Entry<br/>Into Excel]
    DropBox --> DataEntry
    PhoneCall --> DataEntry

    DataEntry --> Spreadsheet[(Excel Spreadsheet<br/>Production Database)]
    Spreadsheet --> Allocate[Calculate Well Allocations<br/>By Working Interest]
    Allocate --> Reports[Generate Reports<br/>- Daily Production<br/>- Monthly Summary<br/>- Partner Allocations]
    Reports --> Distribution[Distribute Reports<br/>Email/Mail/Portal]

    style Well fill:#bbf
    style Spreadsheet fill:#fbb
    style Reports fill:#bfb
```

### Production Sales Process

```mermaid
flowchart LR
    Production[Daily Production] --> Purchaser{Purchaser Pickup}
    Purchaser -->|Oil| TruckTicket[Truck Run Ticket<br/>Volume & Gravity]
    Purchaser -->|Gas| MeterRead[Gas Meter Reading<br/>MCF & BTU]

    TruckTicket --> OilStatement[Oil Purchaser Statement<br/>Monthly]
    MeterRead --> GasStatement[Gas Purchaser Statement<br/>Monthly]

    OilStatement --> Reconcile[Reconcile with<br/>Internal Records]
    GasStatement --> Reconcile

    Reconcile --> Issues{Discrepancies?}
    Issues -->|Yes| Dispute[Contact Purchaser<br/>Resolve Differences]
    Issues -->|No| Accept[Accept Statement]
    Dispute --> Accept

    Accept --> Revenue[Record Revenue<br/>Update Financials]
    Revenue --> Distribute[Distribute to<br/>Partners]
```

## Financial Management Process

### Joint Interest Billing (JIB) Process

```mermaid
flowchart TD
    Start([Month End]) --> Gather[Gather All Expenses<br/>- Operating Costs<br/>- Maintenance<br/>- Workovers]
    Gather --> Categorize[Categorize Expenses<br/>By Well/Lease]
    Categorize --> Calculate[Calculate Partner Shares<br/>Based on Working Interest]
    Calculate --> Create[Create JIB Statements<br/>In Excel]
    Create --> Review[Management Review<br/>& Approval]
    Review --> Send[Send to Partners<br/>Email with PDF]
    Send --> Wait[Wait for Payment<br/>30 Day Terms]
    Wait --> Receive{Payment Received?}
    Receive -->|Yes| Record[Record Payment<br/>Update AR]
    Receive -->|No| FollowUp[Follow Up<br/>Phone/Email]
    FollowUp --> Wait
    Record --> End([Close Month])

    style Start fill:#90EE90
    style End fill:#FFB6C1
```

### Revenue Distribution Process

```mermaid
flowchart TD
    Revenue[Monthly Oil & Gas Revenue] --> Gross[Calculate Gross Revenue<br/>Price × Volume]
    Gross --> Deduct[Deduct Expenses<br/>- Severance Tax<br/>- Transportation<br/>- Processing]
    Deduct --> Net[Calculate Net Revenue]
    Net --> Allocate[Allocate by Interest Type]

    Allocate --> WI[Working Interest<br/>Partners]
    Allocate --> RI[Royalty Interest<br/>Owners]
    Allocate --> ORRI[Overriding Royalty<br/>Interest]

    WI --> WICalc[Calculate Share<br/>Net × WI%]
    RI --> RICalc[Calculate Share<br/>Gross × 1/8]
    ORRI --> ORRICalc[Calculate Share<br/>Gross × ORRI%]

    WICalc --> Statements[Generate Owner<br/>Statements]
    RICalc --> Statements
    ORRICalc --> Statements

    Statements --> Payment{Payment Method}
    Payment -->|Check| PrintCheck[Print & Mail<br/>Checks]
    Payment -->|ACH| BankTransfer[Initiate ACH<br/>Transfer]
    Payment -->|Hold| Suspense[Hold in Suspense<br/>Min. Payment Not Met]
```

## Regulatory Compliance Process

### Monthly Compliance Workflow

```mermaid
flowchart TD
    Calendar([Compliance Calendar]) --> Check[Check Deadlines<br/>This Month]
    Check --> FormPR{Form PR Due?}
    FormPR -->|Yes| GatherProd[Gather Production Data<br/>From Excel]
    FormPR -->|No| OtherReports{Other Reports Due?}

    GatherProd --> FillForm[Manually Fill Out<br/>Form PR]
    FillForm --> DoubleCheck[Double Check<br/>All Numbers]
    DoubleCheck --> Submit[Submit to RRC<br/>Online Portal]
    Submit --> Confirm[Save Confirmation<br/>File Copy]

    OtherReports -->|Yes| IdentifyReq[Identify Requirements<br/>Gather Data]
    OtherReports -->|No| SafetyCheck{Safety Training Due?}

    IdentifyReq --> PrepareRep[Prepare Report<br/>Manual Process]
    PrepareRep --> SubmitRep[Submit Report<br/>Mail/Email/Portal]
    SubmitRep --> Confirm

    SafetyCheck -->|Yes| Schedule[Schedule Training<br/>Notify Staff]
    SafetyCheck -->|No| EndCompliance([Compliance Complete])

    Schedule --> Conduct[Conduct Training<br/>Document Attendance]
    Conduct --> File[File Documentation]
    File --> EndCompliance

    Confirm --> EndCompliance

    style Calendar fill:#90EE90
    style EndCompliance fill:#FFB6C1
```

### Environmental Incident Response

```mermaid
flowchart TD
    Incident([Incident Occurs]) --> Assess[Assess Severity<br/>Stop Operations]
    Assess --> Contain[Contain Spill/Release<br/>Deploy Resources]
    Contain --> Document[Document Everything<br/>Photos, Measurements]
    Document --> Report{Reportable Quantity?}

    Report -->|Yes| Immediate[Immediate Notification<br/>Within 24 Hours]
    Report -->|No| Internal[Internal Documentation<br/>Only]

    Immediate --> Agencies[Notify Agencies<br/>- EPA<br/>- State Agency<br/>- Local Emergency]
    Agencies --> Written[Written Follow-up<br/>Within 5 Days]
    Written --> Investigation[Conduct Investigation<br/>Root Cause Analysis]

    Internal --> Investigation

    Investigation --> Remediate[Remediation Plan<br/>Clean-up Activities]
    Remediate --> Monitor[Monitor Progress<br/>Document Actions]
    Monitor --> Close[Close Out Incident<br/>Final Report]

    style Incident fill:#ff6666
    style Close fill:#90EE90
```

## Partner & Stakeholder Management

### Partner Communication Process

```mermaid
flowchart LR
    Monthly[Monthly Cycle Starts] --> Production[Production Report<br/>Prepared in Excel]
    Production --> Financial[Financial Statement<br/>JIB Statement]
    Financial --> Package[Package Documents<br/>Cover Letter]
    Package --> Send{Distribution Method}

    Send -->|Email| EmailSend[Email PDF<br/>Attachments]
    Send -->|Mail| Print[Print & Mail<br/>Physical Copies]
    Send -->|Portal| Upload[Upload to<br/>Partner Portal]

    EmailSend --> Wait[Wait for Response<br/>Questions/Concerns]
    Print --> Wait
    Upload --> Wait

    Wait --> Questions{Questions Received?}
    Questions -->|Yes| Answer[Research & Respond<br/>Phone/Email]
    Questions -->|No| File[File Communications]
    Answer --> File

    File --> Next[Next Month]
```

### Working Interest Partner Voting

```mermaid
flowchart TD
    Proposal[Major Decision Needed<br/>AFE > $50,000] --> Prepare[Prepare AFE Package<br/>- Cost Estimates<br/>- Technical Data<br/>- Risk Assessment]
    Prepare --> Notify[Notify All Partners<br/>Send Package]
    Notify --> Meeting{Meeting Required?}

    Meeting -->|Yes| Schedule[Schedule Meeting<br/>In-person/Call]
    Meeting -->|No| Written[Written Consent<br/>Process]

    Schedule --> Present[Present Proposal<br/>Q&A Session]
    Present --> Vote[Call for Vote]

    Written --> Deadline[30-Day Response<br/>Deadline]
    Deadline --> Collect[Collect Responses]
    Collect --> Vote

    Vote --> Tally[Tally Votes<br/>By Working Interest %]
    Tally --> Result{Approved?>65%}

    Result -->|Yes| Proceed[Proceed with Project<br/>Notify All Partners]
    Result -->|No| Reject[Project Rejected<br/>Notify All Partners]

    style Proposal fill:#ffd700
```

## Maintenance & Service Management

### Routine Maintenance Process

```mermaid
flowchart TD
    Schedule([Maintenance Schedule]) --> Review[Review Equipment List<br/>Check Service Intervals]
    Review --> Due{Maintenance Due?}
    Due -->|Yes| WorkOrder[Create Work Order<br/>Paper/Excel]
    Due -->|No| NextEquip[Check Next Equipment]
    NextEquip --> Review

    WorkOrder --> Assign{Who Performs?}
    Assign -->|Internal| Pumper[Assign to Pumper<br/>Add to Route]
    Assign -->|External| Vendor[Contact Vendors<br/>Get Quotes]

    Pumper --> Perform1[Perform Maintenance<br/>Document Work]

    Vendor --> Select[Select Vendor<br/>Schedule Work]
    Select --> Perform2[Vendor Performs<br/>Work]

    Perform1 --> Complete[Mark Complete<br/>Update Records]
    Perform2 --> Invoice[Receive Invoice<br/>Verify Work]
    Invoice --> Complete

    Complete --> File[File Documentation<br/>Update Schedule]
    File --> End([Maintenance Complete])

    style Schedule fill:#90EE90
    style End fill:#FFB6C1
```

### Emergency Repair Process

```mermaid
flowchart TD
    Failure([Equipment Failure]) --> Report[Pumper Reports<br/>Calls Supervisor]
    Report --> Assess[Assess Severity<br/>Production Impact]
    Assess --> Critical{Critical?}

    Critical -->|Yes| Immediate[Immediate Response<br/>Call Emergency Vendor]
    Critical -->|No| Schedule[Schedule Repair<br/>Next Available]

    Immediate --> Mobilize[Mobilize Crew<br/>Rush to Site]
    Mobilize --> Diagnose[Diagnose Problem<br/>Determine Fix]

    Schedule --> NextDay[Next Day Service<br/>Normal Priority]
    NextDay --> Diagnose

    Diagnose --> Parts{Parts Needed?}
    Parts -->|Yes| Order[Order Parts<br/>Express Shipping]
    Parts -->|No| Repair[Perform Repair]

    Order --> Wait[Wait for Delivery<br/>Production Down]
    Wait --> Repair

    Repair --> Test[Test Equipment<br/>Verify Operation]
    Test --> Invoice[Receive Invoice<br/>High Cost]
    Invoice --> Approve[Get Approval<br/>If Over Limit]
    Approve --> Pay[Process Payment]

    style Failure fill:#ff6666
    style Test fill:#90EE90
```

## Information Flow & Communication

### Daily Information Flow

```mermaid
flowchart TB
    Field[Field Operations] --> Data1[Production Data<br/>Paper Tickets]
    Field --> Data2[Equipment Status<br/>Phone Calls]
    Field --> Data3[Issues/Problems<br/>Text Messages]

    Data1 --> Office[Office Processing]
    Data2 --> Office
    Data3 --> Office

    Office --> Excel[(Excel Spreadsheets<br/>Master Database)]
    Office --> FileCabinet[(File Cabinet<br/>Physical Documents)]
    Office --> Email[(Email System<br/>Digital Records)]

    Excel --> Reports[Reports Generation<br/>Manual Process]
    FileCabinet --> Reports
    Email --> Reports

    Reports --> Internal[Internal Use<br/>Decision Making]
    Reports --> External[External Distribution<br/>Partners/Agencies]

    style Field fill:#bbf
    style Office fill:#fbf
    style Reports fill:#bfb
```

### Communication Channels

```mermaid
graph TD
    Owner[Owner/Operator] ---|Daily Calls| FieldSup[Field Supervisor]
    Owner ---|Monthly Meetings| Partners[Partners]
    Owner ---|As Needed| Regulators[Regulatory Agencies]

    FieldSup ---|Daily Check-ins| Pumpers[Pumpers]
    FieldSup ---|Work Orders| Vendors[Service Vendors]

    Office[Office Manager] ---|Email/Phone| Purchasers[Oil/Gas Purchasers]
    Office ---|Monthly Statements| Royalty[Royalty Owners]
    Office ---|Invoices| Accounting[Accountant]

    Pumpers ---|Text/Call| FieldSup
    Vendors ---|Invoices| Office

    style Owner fill:#f9f,stroke:#333,stroke-width:4px
    style FieldSup fill:#bbf
    style Office fill:#fbf
```

## Decision-Making Processes

### Operational Decision Tree

```mermaid
flowchart TD
    Issue[Operational Issue Identified] --> Cost{Cost Estimate}

    Cost -->|< $5,000| Supervisor[Field Supervisor<br/>Approves]
    Cost -->|$5,000-$25,000| Manager[Office Manager +<br/>Field Supervisor]
    Cost -->|$25,000-$50,000| Owner[Owner Approval<br/>Required]
    Cost -->|> $50,000| Partners[Partner Vote<br/>Required]

    Supervisor --> Execute1[Execute Work]
    Manager --> OwnerNotify[Notify Owner]
    OwnerNotify --> Execute2[Execute Work]
    Owner --> AFEPrep[Prepare AFE]
    Partners --> AFEVote[AFE Vote Process]

    AFEPrep --> Execute3[Execute if Approved]
    AFEVote --> Result{Approved?}
    Result -->|Yes| Execute4[Execute Project]
    Result -->|No| Alternative[Seek Alternatives]

    Execute1 --> Document[Document Decision]
    Execute2 --> Document
    Execute3 --> Document
    Execute4 --> Document
    Alternative --> Document
```

### Financial Decision Process

```mermaid
flowchart TD
    Financial[Financial Decision Needed] --> Type{Type of Decision}

    Type -->|Routine Expenses| AutoApprove[Auto-Approved<br/>Within Budget]
    Type -->|Capital Investment| Analysis[Financial Analysis<br/>ROI Calculation]
    Type -->|Emergency Expense| FastTrack[Fast-Track Approval<br/>Fix Now, Approve Later]
    Type -->|Partner Distribution| Formula[Follow JOA Formula<br/>No Discretion]

    Analysis --> Model[Build Financial Model<br/>In Excel]
    Model --> Review[Management Review]
    Review --> Decision{Go/No-Go}

    Decision -->|Go| Funding[Arrange Funding]
    Decision -->|No-Go| Defer[Defer/Cancel]

    Funding --> Implement[Implement Decision]
    AutoApprove --> Implement
    FastTrack --> Implement
    Formula --> Implement
    Defer --> Revisit[Revisit Later]

    Implement --> Track[Track Results]
    Track --> Learn[Document Lessons]
```

## Key Pain Points in Current Processes

### Time Consumption Analysis

| Process                   | Manual Time | Frequency   | Monthly Hours     |
| ------------------------- | ----------- | ----------- | ----------------- |
| Production Data Entry     | 2-3 hours   | Daily       | 60-90             |
| JIB Statement Preparation | 16-24 hours | Monthly     | 16-24             |
| Regulatory Reporting      | 8-12 hours  | Monthly     | 8-12              |
| Invoice Processing        | 1 hour each | 20-30/month | 20-30             |
| Partner Communications    | 4-6 hours   | Weekly      | 16-24             |
| **Total Administrative**  | -           | -           | **120-180 hours** |

### Error-Prone Areas

1. **Manual Data Entry**: 5-10% error rate in production volumes
2. **Excel Calculations**: Formula errors in complex JIB allocations
3. **Paper Tickets**: Lost or damaged tickets, illegible writing
4. **Communication Gaps**: Missed emails, forgotten phone messages
5. **Compliance Deadlines**: Manual tracking leads to missed deadlines

### Inefficiency Bottlenecks

```mermaid
graph TD
    Bottleneck1[Paper to Digital<br/>Transcription Delays] --> Impact1[Late Reports]
    Bottleneck2[Excel Limitations<br/>Manual Calculations] --> Impact2[JIB Delays]
    Bottleneck3[Phone Tag<br/>Communication] --> Impact3[Slow Decisions]
    Bottleneck4[Physical Document<br/>Filing/Retrieval] --> Impact4[Audit Issues]
    Bottleneck5[Manual Approval<br/>Routing] --> Impact5[Payment Delays]

    style Bottleneck1 fill:#ff9999
    style Bottleneck2 fill:#ff9999
    style Bottleneck3 fill:#ff9999
    style Bottleneck4 fill:#ff9999
    style Bottleneck5 fill:#ff9999
```

## Conclusion

The current state of small oil & gas operator businesses relies heavily on:

1. **Manual Processes**: 70-80% of work is manual data handling
2. **Paper Systems**: Critical data starts on paper, creating transcription
   delays
3. **Excel Dependency**: Complex business logic trapped in spreadsheets
4. **Person-Dependent Knowledge**: Processes rely on individual knowledge
5. **Reactive Management**: Problems addressed after they occur
6. **Communication Delays**: Multi-step, asynchronous communication paths

These manual processes consume 120-180 hours per month of administrative time
for a typical 20-well operation, representing a significant opportunity for
automation and efficiency improvements. The lack of real-time data and
predictive capabilities means operators are always reacting to yesterday's
problems rather than preventing tomorrow's issues.

---

_This document represents the baseline "as-is" state against which automation
improvements can be measured. Each manual process identified here represents an
opportunity for digital transformation._
