# KAN-41: Environmental Incident Tracking System (Requirements & Acceptance Criteria)

## Goal

Provide end-to-end Environmental Incident Tracking for oil & gas operators,
supporting reporting, investigation, remediation, regulatory notifications, and
closure with robust auditability and RBAC.

## Scope (MVP)

- Incident capture (spill/leak/emission/other) with severity and status
  lifecycle
- Link to Organization and optional Well
- Core fields: incidentNumber, incidentType, incidentDate, discoveryDate,
  location, description, causeAnalysis, substanceInvolved, estimatedVolume +
  unit
- Severity: low | medium | high | critical
- Status: open | investigating | remediation | closed
- Regulatory notification capture: agency, report number, submission date;
  boolean regulatoryNotification + notificationDate on incident
- Remediation actions list (JSON array of actions with actor, date, description,
  status)
- List/filter and retrieval endpoints; basic pagination
- Audit trail via domain events
- RBAC (operators/admin/compliance) and validation

## Out of scope (MVP)

- File attachments (can be added later)
- Geospatial mapping (later)
- Workflow engine (later)

## Data Model (Existing)

- environmental_incidents (already in DB schema)
- spill_reports (already in DB schema) for regulator-specific report tracking

## Domain & Architecture

- Bounded Context: EnvironmentalIncidents
- Aggregate Root: EnvironmentalIncident
- Value Objects: Severity, Volume (value + unit), IncidentType, Location (string
  for MVP)
- Domain Events: IncidentReported, IncidentStatusChanged, RegulatoryNotified,
  RemediationActionAdded, IncidentClosed
- Ports: EnvironmentalIncidentRepository (persist/read), NotificationPort
  (future), ComplianceCalendarPort (future)
- CQRS: Commands and Queries per below

## Commands (MVP)

- ReportEnvironmentalIncident
- ChangeEnvironmentalIncidentStatus
- AddRemediationActionToIncident
- RecordRegulatoryNotificationForIncident
- CloseEnvironmentalIncident

## Queries (MVP)

- GetEnvironmentalIncidentById
- ListEnvironmentalIncidents (filters: type, severity, status, date range,
  wellId, regulatoryNotified)

## API Endpoints (MVP)

- POST /incidents
- PATCH /incidents/:id/status
- POST /incidents/:id/remediation-actions
- POST /incidents/:id/regulatory-notifications
- POST /incidents/:id/close
- GET /incidents/:id
- GET /incidents

## Validation Rules (examples)

- incidentDate <= discoveryDate? (discovery should be >= incidentDate). MVP:
  allow equal; block future dates
- estimatedVolume >= 0; volumeUnit in {barrels,gallons,cubic_feet}
- status transitions permitted: open -> investigating -> remediation -> closed;
  allow direct open->remediation when justified
- regulatoryNotification requires agency, reportNumber, submissionDate

## RBAC (examples)

- Operator: create incidents; add info; cannot close without compliance approval
- Compliance/Admin: change status, record regulatory notifications, close
  incidents

## Acceptance Criteria

1. Create incident: Given valid DTO, POST /incidents returns 201 with id; event
   IncidentReported emitted; record persisted.
2. Status change: PATCH /incidents/:id/status validates allowed transition and
   updates; emits IncidentStatusChanged.
3. Regulatory notification: POST /incidents/:id/regulatory-notifications records
   spill_reports row and toggles regulatoryNotification + notificationDate when
   applicable; emits RegulatoryNotified.
4. Remediation action: POST /incidents/:id/remediation-actions appends action;
   emits RemediationActionAdded.
5. Close: POST /incidents/:id/close sets status closed when remediation
   complete; emits IncidentClosed.
6. List/filter: GET /incidents supports filters and pagination; returns items
   and counts.
7. Security: RBAC enforced; invalid roles receive 403.
8. Auditability: Domain events recorded (log or event bus) for the above
   transitions.

## References

- EPA CERCLA/EPCRA release reporting (federal) and state (e.g., Texas RRC/TCEQ);
  BSEE SEMS (offshore)
- API RP 754 for process safety indicators (future KPI alignment)
