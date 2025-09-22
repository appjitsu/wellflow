# Oil & Gas Upstream Operations Workflow Diagrams

**Last Updated**: January 2025  
**Status**: Comprehensive Visual Guide  
**Purpose**: Complete visual representation of upstream oil and gas operations
workflows

This document provides detailed Mermaid diagrams illustrating the complete
business workflow of upstream oil and gas operators, from lease acquisition
through production and revenue distribution.

## 🎯 **Overview: Complete Upstream Operations Lifecycle**

```mermaid
graph TB
    subgraph "Phase 1: Land Acquisition & Legal"
        LA[Land Acquisition] --> TR[Title Research]
        TR --> LN[Lease Negotiation]
        LN --> LS[Lease Signing]
        LS --> LR[Lease Recording]
    end

    subgraph "Phase 2: Exploration & Development"
        LR --> GS[Geological Survey]
        GS --> SP[Seismic Program]
        SP --> AFE[AFE Preparation]
        AFE --> PA[Partner Approval]
        PA --> DP[Drilling Permits]
    end

    subgraph "Phase 3: Drilling Operations"
        DP --> CS[Contractor Selection]
        CS --> WS[Well Spudding]
        WS --> DO[Drilling Operations]
        DO --> WC[Well Completion]
        WC --> WT[Well Testing]
    end

    subgraph "Phase 4: Production Operations"
        WT --> PI[Production Initiation]
        PI --> DM[Daily Monitoring]
        DM --> PM[Production Measurement]
        PM --> RA[Revenue Accounting]
        RA --> RD[Revenue Distribution]
    end

    subgraph "Phase 5: Ongoing Operations"
        RD --> CM[Compliance Management]
        CM --> EM[Equipment Maintenance]
        EM --> RM[Reserves Management]
        RM --> EI[Environmental Impact]
        EI --> DM
    end

    style LA fill:#e1f5fe
    style AFE fill:#fff3e0
    style DO fill:#f3e5f5
    style DM fill:#e8f5e8
    style CM fill:#fff8e1
```

## 🏛️ **Phase 1: Land Management & Lease Administration**

### **1.1 Lease Acquisition Workflow**

```mermaid
flowchart TD
    subgraph "Prospect Identification"
        PI[Prospect Identification] --> GE[Geological Evaluation]
        GE --> MA[Market Analysis]
        MA --> FS[Feasibility Study]
    end

    subgraph "Title Research & Due Diligence"
        FS --> TR[Title Research]
        TR --> TO[Title Opinion]
        TO --> CI[Curative Items Identified]
        CI --> CR[Curative Resolution]
        CR --> TC[Title Clearance]
    end

    subgraph "Lease Negotiation"
        TC --> LN[Lease Negotiation]
        LN --> BP[Bonus Payment]
        LN --> RR[Royalty Rate]
        LN --> PT[Primary Term]
        LN --> RP[Rental Payments]
    end

    subgraph "Legal Documentation"
        BP --> LD[Legal Documentation]
        RR --> LD
        PT --> LD
        RP --> LD
        LD --> LS[Lease Signing]
        LS --> LRec[Lease Recording]
        LRec --> LM[Lease Management]
    end

    style PI fill:#e3f2fd
    style TR fill:#fff3e0
    style LN fill:#f1f8e9
    style LD fill:#fce4ec
```

### **1.2 Title Management & Curative Process**

```mermaid
stateDiagram-v2
    [*] --> TitleExamination
    TitleExamination --> CleanTitle : No Defects Found
    TitleExamination --> DefectsIdentified : Defects Found

    DefectsIdentified --> CurativeRequired
    CurativeRequired --> MissingHeir : Heir Issues
    CurativeRequired --> InvalidDeed : Deed Problems
    CurativeRequired --> TaxLien : Tax Issues
    CurativeRequired --> Probate : Estate Issues

    MissingHeir --> HeirLocation
    HeirLocation --> HeirConsent
    HeirConsent --> CurativeComplete

    InvalidDeed --> DeedCorrection
    DeedCorrection --> NewDeed
    NewDeed --> CurativeComplete

    TaxLien --> TaxPayment
    TaxPayment --> LienRelease
    LienRelease --> CurativeComplete

    Probate --> EstateProceedings
    EstateProceedings --> ProbateComplete
    ProbateComplete --> CurativeComplete

    CurativeComplete --> CleanTitle
    CleanTitle --> LeaseReady
    LeaseReady --> [*]
```

## 💰 **Phase 2: Financial Operations & AFE Management**

### **2.1 AFE (Authorization for Expenditure) Workflow**

```mermaid
flowchart TD
    subgraph "AFE Preparation"
        AP[AFE Preparation] --> CE[Cost Estimation]
        CE --> LI[Line Items Detail]
        LI --> BC[Budget Categories]
        BC --> AFD[AFE Documentation]
    end

    subgraph "Partner Approval Process"
        AFD --> PS[Partner Submission]
        PS --> PR[Partner Review]
        PR --> PA[Partner Approval]
        PR --> PO[Partner Objection]
        PO --> AN[AFE Negotiation]
        AN --> AR[AFE Revision]
        AR --> PS
        PA --> AA[AFE Authorized]
    end

    subgraph "Cost Tracking"
        AA --> CT[Cost Tracking]
        CT --> IE[Invoice Entry]
        IE --> CV[Cost Verification]
        CV --> CA[Cost Allocation]
        CA --> JIB[JIB Statement]
    end

    subgraph "Budget Management"
        JIB --> BM[Budget Monitoring]
        BM --> VO[Variance Oversight]
        VO --> BC2[Budget Control]
        BC2 --> CR[Cost Reporting]
    end

    style AP fill:#e8f5e8
    style PS fill:#fff3e0
    style CT fill:#f3e5f5
    style BM fill:#e1f5fe
```

### **2.2 Revenue Distribution & Division Orders**

```mermaid
flowchart LR
    subgraph "Production Data"
        PD[Production Data] --> PA[Production Allocation]
        PA --> PS[Price Settlement]
        PS --> GR[Gross Revenue]
    end

    subgraph "Division Orders"
        GR --> DO[Division Orders]
        DO --> DI[Decimal Interest]
        DI --> WI[Working Interest]
        DI --> RI[Royalty Interest]
        DI --> OR[Overriding Royalty]
    end

    subgraph "Revenue Calculation"
        WI --> RC[Revenue Calculation]
        RI --> RC
        OR --> RC
        RC --> TD[Tax Deductions]
        TD --> TF[Transportation Fees]
        TF --> NR[Net Revenue]
    end

    subgraph "Payment Distribution"
        NR --> PD2[Payment Distribution]
        PD2 --> OS[Owner Statements]
        OS --> CP[Check Processing]
        CP --> PR[Payment Records]
    end

    style PD fill:#e8f5e8
    style DO fill:#fff3e0
    style RC fill:#f3e5f5
    style PD2 fill:#e1f5fe
```

## 🔧 **Phase 3: Drilling Operations Workflow**

### **3.1 Daily Drilling Reports (DDR) Process**

```mermaid
sequenceDiagram
    participant Driller
    participant Company Man
    participant Operator
    participant Contractor
    participant Regulatory

    Note over Driller, Regulatory: Daily Drilling Operations Cycle

    Driller->>Company Man: Morning Report (Depth, Progress)
    Company Man->>Operator: Daily Status Update

    loop Every 8 Hours
        Driller->>Driller: Record Operations Data
        Driller->>Company Man: Tour Report
        Company Man->>Operator: Progress Update
    end

    Company Man->>Contractor: Daily Cost Summary
    Contractor->>Operator: Invoice & Time Records

    Operator->>Operator: Compile DDR
    Operator->>Regulatory: Submit DDR (if required)

    Note over Operator: DDR Contains:
    Note over Operator: - Depth Progress
    Note over Operator: - Time Breakdown
    Note over Operator: - Mud Properties
    Note over Operator: - Formation Tops
    Note over Operator: - Daily Costs
    Note over Operator: - Safety Incidents
```

### **3.2 Well Completion Operations**

```mermaid
graph TD
    subgraph "Pre-Completion"
        TD[Total Depth Reached] --> WL[Well Logging]
        WL --> FE[Formation Evaluation]
        FE --> CD[Completion Design]
        CD --> CE[Completion Equipment]
    end

    subgraph "Completion Operations"
        CE --> CS[Casing Setting]
        CS --> CM[Cementing]
        CM --> PF[Perforation]
        PF --> ST[Stimulation/Fracturing]
        ST --> TI[Tubing Installation]
    end

    subgraph "Testing & Evaluation"
        TI --> WT[Well Testing]
        WT --> PT[Production Testing]
        PT --> FR[Flow Rate Analysis]
        FR --> WE[Well Evaluation]
    end

    subgraph "Production Setup"
        WE --> ES[Equipment Setup]
        ES --> PI[Production Initiation]
        PI --> PM[Production Monitoring]
        PM --> RA[Revenue Accounting]
    end

    style TD fill:#e3f2fd
    style CS fill:#fff3e0
    style WT fill:#f1f8e9
    style ES fill:#fce4ec
```

## 📊 **Phase 4: Production Operations & Monitoring**

### **4.1 Daily Production Workflow**

```mermaid
flowchart TD
    subgraph "Field Operations"
        FI[Field Inspection] --> TG[Tank Gauging]
        TG --> MR[Meter Reading]
        MR --> EI[Equipment Inspection]
        EI --> SM[Safety Monitoring]
    end

    subgraph "Data Collection"
        SM --> DC[Data Collection]
        DC --> DV[Data Validation]
        DV --> QC[Quality Control]
        QC --> DR[Data Recording]
    end

    subgraph "Production Accounting"
        DR --> PA[Production Allocation]
        PA --> SC[Shrinkage Calculation]
        SC --> BA[BTU Adjustment]
        BA --> NP[Net Production]
    end

    subgraph "Revenue Processing"
        NP --> PP[Price Posting]
        PP --> RC[Revenue Calculation]
        RC --> TD[Tax Deduction]
        TD --> RD[Revenue Distribution]
    end

    style FI fill:#e8f5e8
    style DC fill:#fff3e0
    style PA fill:#f3e5f5
    style PP fill:#e1f5fe
```

### **4.2 Custody Transfer & Measurement**

```mermaid
stateDiagram-v2
    [*] --> TankGauging
    [*] --> MeterMeasurement
    [*] --> LACTUnit

    TankGauging --> GrossVolume
    GrossVolume --> TemperatureCorrection
    TemperatureCorrection --> BSWDeduction
    BSWDeduction --> NetVolume

    MeterMeasurement --> FlowRate
    FlowRate --> TotalVolume
    TotalVolume --> MeterCorrection
    MeterCorrection --> NetVolume

    LACTUnit --> AutomaticMeasurement
    AutomaticMeasurement --> QualityTesting
    QualityTesting --> CustodyTransfer
    CustodyTransfer --> NetVolume

    NetVolume --> ProductionRecord
    ProductionRecord --> RevenueCalculation
    RevenueCalculation --> [*]
```

## 🏛️ **Phase 5: Regulatory Compliance & Environmental**

### **5.1 Automated Regulatory Reporting Workflow**

```mermaid
flowchart TD
    subgraph "Data Collection"
        PD[Production Data] --> DV[Data Validation]
        WD[Well Data] --> DV
        FD[Financial Data] --> DV
        DV --> DC[Data Compilation]
    end

    subgraph "Form Generation"
        DC --> FPR[Form PR Generation]
        DC --> ST[Severance Tax Calc]
        DC --> ER[Environmental Reports]
        FPR --> FV[Form Validation]
        ST --> FV
        ER --> FV
    end

    subgraph "Automated Submission"
        FV --> AS[Automated Submission]
        AS --> RRC[Texas RRC Portal]
        AS --> EPA[EPA Systems]
        AS --> STATE[State Agencies]
        RRC --> CF[Confirmation]
        EPA --> CF
        STATE --> CF
    end

    subgraph "Compliance Tracking"
        CF --> CT[Compliance Tracking]
        CT --> DM[Deadline Monitoring]
        DM --> AL[Alerts & Notifications]
        AL --> CR[Compliance Reporting]
    end

    style PD fill:#e8f5e8
    style FPR fill:#fff3e0
    style AS fill:#f3e5f5
    style CT fill:#e1f5fe
```

### **5.2 Environmental Incident Management**

```mermaid
sequenceDiagram
    participant Field
    participant Operator
    participant Regulatory
    participant Cleanup
    participant Legal

    Field->>Operator: Incident Detected
    Operator->>Operator: Immediate Response
    Operator->>Regulatory: Notification (24hrs)

    alt Major Incident
        Operator->>Cleanup: Emergency Response
        Cleanup->>Field: Containment Actions
        Operator->>Legal: Legal Notification
    else Minor Incident
        Operator->>Field: Internal Response
    end

    Operator->>Regulatory: Incident Report (15 days)
    Regulatory->>Operator: Investigation

    loop Cleanup Process
        Cleanup->>Field: Remediation Actions
        Field->>Operator: Progress Reports
        Operator->>Regulatory: Status Updates
    end

    Cleanup->>Operator: Cleanup Complete
    Operator->>Regulatory: Final Report
    Regulatory->>Operator: Case Closure
```

## 🔗 **Phase 6: Industry Software Integration Workflow**

### **6.1 Data Integration Architecture**

```mermaid
graph TB
    subgraph "WellFlow Core"
        WF[WellFlow Platform]
        API[Integration API]
        DT[Data Transformer]
        SM[Sync Manager]
    end

    subgraph "Financial Systems"
        QB[QuickBooks]
        SAGE[Sage]
        ERP[ERP Systems]
    end

    subgraph "Regulatory Systems"
        RRC[Texas RRC Portal]
        EPA[EPA Systems]
        STATE[State Agencies]
    end

    subgraph "Operational Systems"
        SCADA[SCADA Systems]
        GIS[GIS Platforms]
        MOBILE[Mobile Apps]
    end

    subgraph "Industry Software"
        QUORUM[Quorum Software]
        PAK[PakEnergy]
        WEN[WEnergy]
    end

    WF --> API
    API --> DT
    DT --> SM

    SM <--> QB
    SM <--> SAGE
    SM <--> ERP

    SM <--> RRC
    SM <--> EPA
    SM <--> STATE

    SM <--> SCADA
    SM <--> GIS
    SM <--> MOBILE

    SM <--> QUORUM
    SM <--> PAK
    SM <--> WEN

    style WF fill:#e1f5fe
    style API fill:#fff3e0
    style SM fill:#e8f5e8
```

## 📈 **Complete Business Process Integration**

### **6.2 End-to-End Workflow Integration**

```mermaid
journey
    title Oil & Gas Upstream Operations Journey
    section Land Acquisition
      Prospect Identification: 3: Geologist
      Title Research: 2: Landman
      Lease Negotiation: 4: Landman
      Lease Recording: 5: Legal
    section Development
      AFE Preparation: 3: Engineer
      Partner Approval: 2: Partners
      Drilling Permits: 4: Regulatory
      Contractor Selection: 5: Operations
    section Drilling
      Well Spudding: 4: Driller
      Daily Operations: 3: Company Man
      Well Completion: 5: Completion Crew
      Well Testing: 4: Engineer
    section Production
      Production Start: 5: Operator
      Daily Monitoring: 4: Pumper
      Revenue Accounting: 3: Accountant
      Distribution: 5: Partners
    section Compliance
      Regulatory Reporting: 2: Compliance
      Environmental Monitoring: 3: Environmental
      Audit Preparation: 4: Management
      Continuous Operations: 5: All
```

## 🔄 **Phase 7: Reserves Management & SEC Reporting**

### **7.1 Reserves Estimation Workflow**

```mermaid
flowchart TD
    subgraph "Data Collection"
        PH[Production History] --> DC[Data Compilation]
        WL[Well Logs] --> DC
        CT[Completion Data] --> DC
        PT[Pressure Tests] --> DC
    end

    subgraph "Decline Curve Analysis"
        DC --> DCA[Decline Curve Analysis]
        DCA --> EXP[Exponential Decline]
        DCA --> HYP[Hyperbolic Decline]
        DCA --> HAR[Harmonic Decline]
        EXP --> CF[Curve Fitting]
        HYP --> CF
        HAR --> CF
    end

    subgraph "Economic Evaluation"
        CF --> EE[Economic Evaluation]
        EE --> PP[Price Projections]
        EE --> OC[Operating Costs]
        EE --> DR[Discount Rate]
        PP --> NPV[NPV Calculation]
        OC --> NPV
        DR --> NPV
    end

    subgraph "Reserves Classification"
        NPV --> RC[Reserves Classification]
        RC --> PDP[Proved Developed Producing]
        RC --> PDNP[Proved Developed Non-Producing]
        RC --> PUD[Proved Undeveloped]
        RC --> PROB[Probable Reserves]
        RC --> POSS[Possible Reserves]
    end

    subgraph "SEC Reporting"
        PDP --> SEC[SEC Reporting]
        PDNP --> SEC
        PUD --> SEC
        SEC --> SMOG[Standardized Measure]
        SMOG --> 10K[10-K Filing]
    end

    style PH fill:#e8f5e8
    style DCA fill:#fff3e0
    style EE fill:#f3e5f5
    style RC fill:#e1f5fe
    style SEC fill:#fff8e1
```

### **7.2 SEC Reserves Reporting Process**

```mermaid
sequenceDiagram
    participant Engineer
    participant Management
    participant Auditor
    participant SEC
    participant Public

    Note over Engineer, Public: Annual SEC Reserves Reporting Cycle

    Engineer->>Engineer: Collect Production Data
    Engineer->>Engineer: Perform Decline Analysis
    Engineer->>Engineer: Calculate Reserves

    Engineer->>Management: Submit Reserves Report
    Management->>Management: Review & Approve

    Management->>Auditor: Engage External Auditor
    Auditor->>Engineer: Request Supporting Data
    Engineer->>Auditor: Provide Documentation

    Auditor->>Auditor: Independent Verification
    Auditor->>Management: Audit Report

    Management->>SEC: File 10-K with Reserves
    SEC->>SEC: Review Filing
    SEC->>Public: Public Disclosure

    Note over Engineer: Key Requirements:
    Note over Engineer: - Proved Reserves Only
    Note over Engineer: - 12-Month Average Pricing
    Note over Engineer: - Standardized Measure
    Note over Engineer: - Independent Audit (if required)
```

## 🏭 **Phase 8: Field Operations & Maintenance**

### **8.1 Pumper Route & Field Inspection Workflow**

```mermaid
flowchart LR
    subgraph "Route Planning"
        RP[Route Planning] --> WA[Well Assignment]
        WA --> OP[Optimize Path]
        OP --> ST[Schedule Time]
        ST --> RR[Route Ready]
    end

    subgraph "Daily Inspection"
        RR --> WV[Well Visit]
        WV --> VI[Visual Inspection]
        VI --> TG[Tank Gauging]
        TG --> MR[Meter Reading]
        MR --> EI[Equipment Inspection]
        EI --> SI[Safety Inspection]
    end

    subgraph "Data Recording"
        SI --> DR[Data Recording]
        DR --> PD[Production Data]
        DR --> MD[Maintenance Data]
        DR --> SD[Safety Data]
        PD --> MU[Mobile Upload]
        MD --> MU
        SD --> MU
    end

    subgraph "Issue Management"
        MU --> IA[Issue Analysis]
        IA --> WO[Work Order]
        IA --> EM[Emergency]
        IA --> RO[Routine Operation]
        WO --> MS[Maintenance Schedule]
        EM --> IR[Immediate Response]
        RO --> NI[Next Inspection]
    end

    style RP fill:#e8f5e8
    style WV fill:#fff3e0
    style DR fill:#f3e5f5
    style IA fill:#e1f5fe
```

### **8.2 Work Order Management System**

```mermaid
stateDiagram-v2
    [*] --> WorkOrderCreated
    WorkOrderCreated --> PendingApproval : Requires Approval
    WorkOrderCreated --> Assigned : Auto-Approved

    PendingApproval --> Approved : Manager Approval
    PendingApproval --> Rejected : Denied
    Rejected --> [*]

    Approved --> Assigned
    Assigned --> InProgress : Work Started
    InProgress --> OnHold : Issue Encountered
    OnHold --> InProgress : Issue Resolved
    InProgress --> Completed : Work Finished

    Completed --> QualityCheck
    QualityCheck --> Approved_Final : QC Passed
    QualityCheck --> InProgress : QC Failed

    Approved_Final --> Closed
    Closed --> [*]

    note right of WorkOrderCreated
        Work Order Types:
        - Preventive Maintenance
        - Corrective Maintenance
        - Emergency Repair
        - Equipment Upgrade
        - Safety Inspection
    end note
```

## 🌍 **Phase 9: Environmental Compliance & Monitoring**

### **9.1 Air Emissions Monitoring & Reporting**

```mermaid
flowchart TD
    subgraph "Emission Sources"
        ES[Emission Sources] --> FG[Fugitive Emissions]
        ES --> VE[Vented Emissions]
        ES --> CE[Combustion Emissions]
        ES --> FE[Flared Emissions]
    end

    subgraph "Monitoring Methods"
        FG --> LDAR[LDAR Program]
        VE --> CF[Calculation Factors]
        CE --> EF[Emission Factors]
        FE --> FM[Flow Measurement]
    end

    subgraph "Data Collection"
        LDAR --> DC[Data Collection]
        CF --> DC
        EF --> DC
        FM --> DC
        DC --> QA[Quality Assurance]
        QA --> DV[Data Validation]
    end

    subgraph "Reporting"
        DV --> QR[Quarterly Reports]
        DV --> AR[Annual Reports]
        DV --> GHG[GHG Inventory]
        QR --> EPA[EPA Submission]
        AR --> EPA
        GHG --> EPA
    end

    style ES fill:#e8f5e8
    style LDAR fill:#fff3e0
    style DC fill:#f3e5f5
    style QR fill:#e1f5fe
```

### **9.2 Spill Response & Remediation Process**

```mermaid
sequenceDiagram
    participant Field
    participant Operator
    participant Emergency
    participant Regulatory
    participant Cleanup
    participant Community

    Field->>Operator: Spill Detected
    Operator->>Operator: Assess Severity

    alt Major Spill (>25 barrels)
        Operator->>Emergency: Emergency Response
        Operator->>Regulatory: Immediate Notification
        Operator->>Community: Public Notification
        Emergency->>Field: Containment Actions
    else Minor Spill (<25 barrels)
        Operator->>Field: Internal Response
        Operator->>Regulatory: 24-Hour Notification
    end

    Operator->>Cleanup: Engage Cleanup Crew
    Cleanup->>Field: Site Assessment
    Cleanup->>Field: Remediation Plan

    loop Cleanup Operations
        Cleanup->>Field: Remediation Activities
        Field->>Operator: Progress Updates
        Operator->>Regulatory: Status Reports
    end

    Cleanup->>Operator: Cleanup Complete
    Operator->>Regulatory: Final Report
    Regulatory->>Operator: Case Closure

    Note over Operator: Required Documentation:
    Note over Operator: - Incident Report
    Note over Operator: - Photos/Videos
    Note over Operator: - Soil/Water Samples
    Note over Operator: - Remediation Records
    Note over Operator: - Cost Documentation
```

This comprehensive workflow diagram system provides visual representation of all
major upstream oil and gas operations, from initial land acquisition through
ongoing production and compliance management. Each diagram shows the
interconnected nature of operations and the critical data flows between
different business processes.

## 📋 **Diagram Usage Guide**

### **For Implementation Planning**

- Use Phase 1-2 diagrams for financial system design
- Reference Phase 3-4 for operational workflows
- Apply Phase 5-6 for compliance and integration planning

### **For System Architecture**

- Integration diagrams show data flow requirements
- State diagrams define business rule logic
- Sequence diagrams illustrate API interaction patterns

### **For User Experience Design**

- Journey maps guide user interface design
- Workflow diagrams inform navigation structure
- Process flows define user task sequences

### **For Compliance Validation**

- Regulatory workflows ensure compliance coverage
- Environmental processes meet EPA requirements
- SEC reporting flows satisfy disclosure obligations
