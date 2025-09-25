import { IEvent } from '@nestjs/cqrs';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  VolumeUnit,
} from '../enums/environmental-incident.enums';
import {
  IncidentClosedEvent,
  IncidentReportedEvent,
  IncidentStatusChangedEvent,
  RegulatoryNotifiedEvent,
  RemediationActionAddedEvent,
} from '../events/environmental-incident.events';

export interface RemediationAction {
  description: string;
  performedBy: string;
  performedAt: Date;
  status?: 'planned' | 'in_progress' | 'complete';
}

export interface EnvironmentalIncidentPrimitives {
  id: string;
  organizationId: string;
  reportedByUserId: string;
  incidentNumber: string;
  incidentType: IncidentType;
  incidentDate: Date;
  discoveryDate: Date;
  wellId?: string;
  location: string;
  description: string;
  causeAnalysis?: string;
  substanceInvolved?: string;
  estimatedVolume?: number;
  volumeUnit?: VolumeUnit;
  severity: IncidentSeverity;
  status: IncidentStatus;
  regulatoryNotification: boolean;
  notificationDate?: Date;
  remediationActions: RemediationAction[];
  closureDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EnvironmentalIncident {
  private id: string;
  private organizationId: string;
  private reportedByUserId: string;
  private incidentNumber: string;
  private incidentType: IncidentType;
  private incidentDate: Date;
  private discoveryDate: Date;
  private wellId?: string;
  private location: string;
  private description: string;
  private causeAnalysis?: string;
  private substanceInvolved?: string;
  private estimatedVolume?: number;
  private volumeUnit?: VolumeUnit;
  private severity: IncidentSeverity;
  private status: IncidentStatus;
  private regulatoryNotification: boolean = false;
  private notificationDate?: Date;
  private remediationActions: RemediationAction[] = [];
  private closureDate?: Date;
  private createdAt: Date;
  private updatedAt: Date;
  private domainEvents: IEvent[] = [];

  constructor(params: {
    id: string;
    organizationId: string;
    reportedByUserId: string;
    incidentNumber: string;
    incidentType: IncidentType;
    incidentDate: Date;
    discoveryDate: Date;
    location: string;
    description: string;
    severity: IncidentSeverity;
    wellId?: string;
    causeAnalysis?: string;
    substanceInvolved?: string;
    estimatedVolume?: number;
    volumeUnit?: VolumeUnit;
  }) {
    this.validate(params);

    this.id = params.id;
    this.organizationId = params.organizationId;
    this.reportedByUserId = params.reportedByUserId;
    this.incidentNumber = params.incidentNumber;
    this.incidentType = params.incidentType;
    this.incidentDate = new Date(params.incidentDate);
    this.discoveryDate = new Date(params.discoveryDate);
    this.location = params.location;
    this.description = params.description;
    this.severity = params.severity;
    this.wellId = params.wellId;
    this.causeAnalysis = params.causeAnalysis;
    this.substanceInvolved = params.substanceInvolved;
    this.estimatedVolume = params.estimatedVolume;
    this.volumeUnit = params.volumeUnit;
    this.status = IncidentStatus.OPEN;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent(
      new IncidentReportedEvent(
        this.id,
        this.organizationId,
        this.incidentNumber,
        this.incidentType,
        this.severity,
      ),
    );
  }

  // Getters (minimal set)
  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getStatus(): IncidentStatus {
    return this.status;
  }
  getSeverity(): IncidentSeverity {
    return this.severity;
  }
  getRemediationActions(): RemediationAction[] {
    return [...this.remediationActions];
  }
  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Persistence mapping (for adapters)
  toPrimitives(): EnvironmentalIncidentPrimitives {
    return {
      id: this.id,
      organizationId: this.organizationId,
      reportedByUserId: this.reportedByUserId,
      incidentNumber: this.incidentNumber,
      incidentType: this.incidentType,
      incidentDate: this.incidentDate,
      discoveryDate: this.discoveryDate,
      wellId: this.wellId,
      location: this.location,
      description: this.description,
      causeAnalysis: this.causeAnalysis,
      substanceInvolved: this.substanceInvolved,
      estimatedVolume: this.estimatedVolume,
      volumeUnit: this.volumeUnit,
      severity: this.severity,
      status: this.status,
      regulatoryNotification: this.regulatoryNotification,
      notificationDate: this.notificationDate,
      remediationActions: this.remediationActions,
      closureDate: this.closureDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  changeStatus(newStatus: IncidentStatus, reason?: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }
    const old = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.addDomainEvent(
      new IncidentStatusChangedEvent(
        this.id,
        this.organizationId,
        old,
        newStatus,
        reason,
      ),
    );
  }

  addRemediationAction(action: RemediationAction): void {
    if (!action.description || !action.performedBy || !action.performedAt) {
      throw new Error(
        'Remediation action requires description, performedBy, performedAt',
      );
    }
    this.remediationActions.push({ ...action });
    this.updatedAt = new Date();
    this.addDomainEvent(
      new RemediationActionAddedEvent(
        this.id,
        this.organizationId,
        action.description,
      ),
    );
  }

  recordRegulatoryNotification(
    agency: string,
    reportNumber: string,
    submissionDate: Date,
  ): void {
    if (!agency || !reportNumber || !submissionDate) {
      throw new Error(
        'Regulatory notification requires agency, reportNumber, submissionDate',
      );
    }
    this.regulatoryNotification = true;
    this.notificationDate = new Date(submissionDate);
    this.updatedAt = new Date();
    this.addDomainEvent(
      new RegulatoryNotifiedEvent(
        this.id,
        this.organizationId,
        agency,
        reportNumber,
        this.notificationDate,
      ),
    );
  }

  close(): void {
    if (this.status === IncidentStatus.CLOSED) return;
    if (this.remediationActions.length === 0) {
      // For MVP, require at least one remediation action before closing
      throw new Error('Cannot close incident without remediation actions');
    }
    this.status = IncidentStatus.CLOSED;
    this.closureDate = new Date();
    this.updatedAt = new Date();
    this.addDomainEvent(
      new IncidentClosedEvent(this.id, this.organizationId, this.closureDate),
    );
  }

  private canTransitionTo(newStatus: IncidentStatus): boolean {
    const map: Record<IncidentStatus, IncidentStatus[]> = {
      [IncidentStatus.OPEN]: [
        IncidentStatus.INVESTIGATING,
        IncidentStatus.REMEDIATION,
      ],
      [IncidentStatus.INVESTIGATING]: [
        IncidentStatus.REMEDIATION,
        IncidentStatus.CLOSED,
      ],
      [IncidentStatus.REMEDIATION]: [IncidentStatus.CLOSED],
      [IncidentStatus.CLOSED]: [],
    };
    return map[this.status].includes(newStatus);
  }

  private validate(params: {
    incidentNumber: string;
    incidentType: IncidentType;
    incidentDate: Date;
    discoveryDate: Date;
    location: string;
    description: string;
    severity: IncidentSeverity;
    estimatedVolume?: number;
    volumeUnit?: VolumeUnit;
    id: string;
    organizationId: string;
    reportedByUserId: string;
  }): void {
    const now = new Date();
    if (!params.incidentNumber || params.incidentNumber.trim().length === 0) {
      throw new Error('incidentNumber is required');
    }
    if (params.incidentDate > now || params.discoveryDate > now) {
      throw new Error('Dates cannot be in the future');
    }
    if (params.discoveryDate < params.incidentDate) {
      throw new Error('discoveryDate cannot be before incidentDate');
    }
    if (params.estimatedVolume !== undefined && params.estimatedVolume < 0) {
      throw new Error('estimatedVolume must be >= 0');
    }
    if (
      params.volumeUnit &&
      !['barrels', 'gallons', 'cubic_feet'].includes(params.volumeUnit)
    ) {
      throw new Error('volumeUnit invalid');
    }
  }

  private addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }
}
