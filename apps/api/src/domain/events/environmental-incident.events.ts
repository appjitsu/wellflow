import { IEvent } from '@nestjs/cqrs';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../enums/environmental-incident.enums';

export class IncidentReportedEvent implements IEvent {
  constructor(
    public readonly incidentId: string,
    public readonly organizationId: string,
    public readonly incidentNumber: string,
    public readonly incidentType: IncidentType,
    public readonly severity: IncidentSeverity,
  ) {}
}

export class IncidentStatusChangedEvent implements IEvent {
  constructor(
    public readonly incidentId: string,
    public readonly organizationId: string,
    public readonly oldStatus: IncidentStatus,
    public readonly newStatus: IncidentStatus,
    public readonly reason?: string,
  ) {}
}

export class RegulatoryNotifiedEvent implements IEvent {
  constructor(
    public readonly incidentId: string,
    public readonly organizationId: string,
    public readonly agency: string,
    public readonly reportNumber: string,
    public readonly submissionDate: Date,
  ) {}
}

export class RemediationActionAddedEvent implements IEvent {
  constructor(
    public readonly incidentId: string,
    public readonly organizationId: string,
    public readonly description: string,
  ) {}
}

export class IncidentClosedEvent implements IEvent {
  constructor(
    public readonly incidentId: string,
    public readonly organizationId: string,
    public readonly closedAt: Date,
  ) {}
}
