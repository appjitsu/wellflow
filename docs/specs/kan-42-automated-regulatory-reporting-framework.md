# KAN-42: Automated Regulatory Reporting Framework

Status: Draft Owner: WellFlow Platform Team Branch:
feature/KAN-42-automated-regulatory-reporting-framework

---

## 1) Problem & Objective

Operators must submit recurring regulatory reports to federal and state
agencies. Manual workflows are error‑prone and miss deadlines. We will implement
a modular Automated Regulatory Reporting Framework that:

- Centralizes report definitions and validation rules per jurisdiction
- Generates electronic filings from production and well data
- Submits via official portals/APIs with retries and circuit breaking
- Tracks status, audit trails, and evidence for compliance
- Enforces RBAC/CASL permissions for generate/validate/submit/export

Applies WellFlow patterns: SOLID, Hexagonal, DDD, CQRS, Repository, DTO, Circuit
Breaker.

---

## 2) Initial Regulatory Scope (phase 1)

- Texas (RRC) – Monthly Production Report (Form PR)
  - Electronic filing via RRC Online. Deadlines posted by RRC (electronic filing
    required in most cases).
  - References:
    - RRC Oil & Gas Forms (PR + PR Instructions):
      <https://www.rrc.texas.gov/oil-and-gas/oil-and-gas-forms/>
    - PR FAQs:
      <https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-reporting-form-pr-faqs/>
    - EDI filing deadlines:
      <https://www.rrc.texas.gov/oil-and-gas/applications-and-permits/oil-gas-edi-filing-deadlines/>
- New Mexico (OCD) – C‑115 Operator’s Monthly Report
  - Electronic submission via OCD Online; supports text file format
    specifications.
  - References:
    - C‑115 Instructions:
      <https://www.emnrd.nm.gov/ocd/wp-content/uploads/sites/6/C-115-INSTRUCTIONS.pdf>
    - OCD Forms: <https://www.emnrd.nm.gov/ocd/ocd-forms/>
    - OCD Online Forms List:
      <https://wwwapps.emnrd.nm.gov/OCD/OCDPermitting/OperatorData/AllOCDForms.aspx>
- Colorado (COGCC) – Form 7 Monthly Report of Operations
  - Electronic submission supported; detailed field specifications.
  - References:
    - Form 7 Specifications:
      <https://ecmc.state.co.us/forms/instructions/form%207%20specs-2.html>
- Federal ONRR/BLM – Oil and Gas Operations Report (OGOR)
  - OGOR A/B/C production reporting to ONRR electronically (per ONRR handbook).
  - References:
    - MPRH (Minerals Production Reporter Handbook):
      <https://onrr.gov/document/MPRH-AllDocs-Combined.pdf>
    - Minerals Revenue Reporter Handbook:
      <https://onrr.gov/document/RRM-Printable.Minerals.Revenue.Handbook.pdf>
- EPA GHGRP Subpart W – GHG emissions for petroleum and natural gas systems
  - Reporting through e‑GGRT; 40 CFR Part 98 Subpart W (amendments 2024–2025).
  - References:
    - Subpart W:
      <https://www.epa.gov/ghgreporting/subpart-w-petroleum-and-natural-gas-systems>
    - eCFR Subpart W: <https://www.ecfr.gov/current/title-40/part-98/subpart-W>
    - e‑GGRT program overview/training:
      <https://www.epa.gov/ghgreporting/ghgrp-events-and-training>

Note: States like ND, OK, LA, WY are candidates for Phase 2.

---

## 3) High‑Level Architecture (Hexagonal + DDD)

Bounded Context: RegulatoryCompliance

- Aggregates:
  - RegulatoryReportDefinition (by jurisdiction + type; field map; validation
    set)
  - RegulatoryReportInstance (period, organization, wells, totals, derived
    values)
  - SubmissionAttempt (transport, payload, response, error codes)
  - FilingSchedule (jurisdiction rules, due dates, grace periods)
- Value Objects: Jurisdiction, Regulator, ReportType, Period (YYYY‑MM),
  ApiNumber, Uwi, FacilityId, Product (Oil/Gas/Water), VolumeUom,
  DispositionCode
- Repositories (ports): ReportDefinitionRepository, ReportInstanceRepository,
  SubmissionRepository, FilingScheduleRepository
- Adapters:
  - TxRrcPrAdapter, NmOcdC115Adapter, CoForm7Adapter, OnrrOgorAdapter,
    EpaSubpartWAdapter
  - Each implements a common interface: buildFile(payload) | submit(file) |
    parseResponse()
- Services (domain/application): ReportGenerationService,
  ReportValidationService, ReportSubmissionService, DeadlineService

---

## 4) CQRS Surface (Commands, Queries, Events)

Commands

- GenerateRegulatoryReportCommand(orgId, jurisdiction, reportType, period)
- ValidateRegulatoryReportCommand(reportId)
- SubmitRegulatoryReportCommand(reportId)
- RetryRegulatorySubmissionCommand(submissionId)
- ScheduleRegulatoryReportsCommand(orgId, jurisdiction, period)

Queries

- GetRegulatoryReportStatusQuery(reportId)
- ListRegulatoryReportsQuery(orgId, period, filters)
- GetFilingCalendarQuery(orgId, jurisdiction)

Domain Events (for audit/notifications)

- RegulatoryReportGenerated
- RegulatoryReportValidated
- RegulatoryReportSubmitted
- RegulatorySubmissionFailed

---

## 5) RBAC/CASL

Actions already include `submitReport` in abilities. We will add
decorators/guards on endpoints:

- generate: action "create" on subject "Well" or new subject "ComplianceReport"
- validate: action "update" on "ComplianceReport"
- submit: action "submitReport" on "Well" or "ComplianceReport"
- export/audit: actions "export" and "audit" Multi‑tenant scoping via
  organizationId/operatorId conditions.

---

## 6) Circuit Breaker & Resilience

- Wrap adapter.submit with CircuitBreaker (closed/open/half‑open)
- Retry with exponential backoff for transient HTTP failures
- Timeouts per regulator endpoint
- Idempotent submission keys (jurisdiction + reportType + period + orgId)

---

## 7) Data Mapping & Validation (DTOs)

- Input DTOs: normalized production by well and month with required identifiers
  (API number/UWI), facility codes where required
- Output DTOs: jurisdiction‑specific flat records (e.g., PR line, C‑115 line)
- Validation rules per jurisdiction (e.g., sums by disposition, volume units,
  decimal precision, product codes)
- Unit conversions and rounding rules where mandated

---

## 8) Scheduling & Deadlines

- Cron/BullMQ jobs compute filing calendar from FilingSchedule rules
- Notify users ahead of deadlines (e.g., T‑10, T‑3, T‑1 days)
- Block submissions after cutoff unless override with audit reason

---

## 9) Initial Deliverables (phase 1)

- API module scaffolding: apps/api/src/regulatory-reporting
  - Entities, value objects, repository interfaces (ports)
  - DTOs for normalized input and jurisdiction outputs
  - CQRS commands/queries/handlers skeletons
  - Controller endpoints protected by AbilitiesGuard
  - Adapters (TxRrcPrAdapter, NmOcdC115Adapter, CoForm7Adapter) with buildFile()
    stubs
  - CircuitBreaker service (shared) and configuration
  - Unit tests for abilities and domain services
- Documentation and OpenAPI endpoints with examples

---

## 10) Test Strategy

- Unit tests: mapping/validation rules per jurisdiction; adapter file builders
- Contract tests: schema conformance for generated files (CSV/TXT
  fixed‑width/XML as applicable)
- E2E (later): sandbox submissions where available; otherwise simulate adapter
  responses
- RBAC tests: ensure only permitted roles can submit/export

---

## 11) Acceptance Criteria

- Given existing production/well data for a tenant
  - Can generate a draft PR (TX), C‑115 (NM), and Form 7 (CO) files for a
    selected period
  - Validation failures are reported with actionable messages
  - Submissions are guarded by circuit breaker and logged with audit trails
  - Permissions enforced via CASL for submit/export

---

## 12) Open Questions

- Which jurisdictions are priority for MVP? (TX, NM, CO assumed)
- Do we need ONRR OGOR in Phase 1 or Phase 2?
- Are there existing credentials or sandbox endpoints per regulator?

---

## 13) Future Phases

- Add OK, ND, LA, WY; ONRR OGOR; EPA Subpart W aggregation
- UI dashboards for filing calendar, status, error remediation
- Source map uploads (where supported) and automated re‑filings
