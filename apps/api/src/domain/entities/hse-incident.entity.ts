import { AggregateRoot } from '../shared/aggregate-root';
import { IncidentType } from '../value-objects/incident-type.vo';
import { IncidentSeverity } from '../value-objects/incident-severity.vo';
import { IncidentReportedEvent } from '../events/incident-reported.event';
import { IncidentStatusChangedEvent } from '../events/incident-status-changed.event';
import { IncidentSeverityChangedEvent } from '../events/incident-severity-changed.event';

/**
 * HSE Incident Aggregate Root
 * Represents a health, safety, and environmental incident with complete lifecycle management
 */
export class HSEIncident extends AggregateRoot {
  private readonly _id: string;
  private _incidentNumber: string;
  private _incidentType: IncidentType;
  private _severity: IncidentSeverity;
  private _organizationId: string;
  private _wellId?: string;

  // Incident details
  private _incidentDate: Date;
  private _discoveryDate?: Date;
  private _location: string;
  private _facilityId?: string;
  private _description: string;

  // Personnel involved
  private _reportedByUserId: string;
  private _affectedPersonnel?: Record<string, unknown>[];

  // Root cause and analysis
  private _rootCauseAnalysis?: Record<string, unknown>;
  private _contributingFactors?: Record<string, unknown>[];

  // Impact assessment
  private _environmentalImpact?: Record<string, unknown>;
  private _propertyDamage?: number;
  private _estimatedCost?: number;

  // Regulatory requirements
  private _reportableAgencies?: string[];
  private _regulatoryNotificationRequired: boolean;
  private _notificationDeadline?: Date;

  // Investigation and response
  private _investigationStatus: string;
  private _investigationLeadUserId?: string;
  private _investigationStartDate?: Date;
  private _investigationCompletionDate?: Date;

  // Status and closure
  private _status: string;
  private _closureDate?: Date;
  private _lessonsLearned?: string;

  // Audit fields
  private _createdAt: Date;
  private _updatedAt: Date;

  // Entity interface implementation
  public getId(): { getValue(): string } {
    return { getValue: () => this._id };
  }

  get id(): string {
    return this._id;
  }

  constructor(
    id: string,
    incidentNumber: string,
    incidentType: IncidentType,
    severity: IncidentSeverity,
    organizationId: string,
    incidentDate: Date,
    location: string,
    description: string,
    reportedByUserId: string,
  ) {
    super();
    this._id = id;
    this._incidentNumber = incidentNumber;
    this._incidentType = incidentType;
    this._severity = severity;
    this._organizationId = organizationId;
    this._incidentDate = incidentDate;
    this._location = location;
    this._description = description;
    this._reportedByUserId = reportedByUserId;
    this._regulatoryNotificationRequired = false;
    this._investigationStatus = 'open';
    this._status = 'open';
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Factory method for creating new incidents
  public static create(
    incidentNumber: string,
    incidentType: IncidentType,
    severity: IncidentSeverity,
    organizationId: string,
    incidentDate: Date,
    location: string,
    description: string,
    reportedByUserId: string,
  ): HSEIncident {
    const incident = new HSEIncident(
      crypto.randomUUID(), // Generate ID
      incidentNumber,
      incidentType,
      severity,
      organizationId,
      incidentDate,
      location,
      description,
      reportedByUserId,
    );

    // Raise domain event
    incident.addDomainEvent(
      new IncidentReportedEvent(
        incident._id,
        incidentNumber,
        incidentType.value,
        severity.value,
      ),
    );

    return incident;
  }

  // Business methods
  public updateSeverity(
    newSeverity: IncidentSeverity,
    _updatedByUserId: string,
  ): void {
    if (!this._severity.canTransitionTo(newSeverity)) {
      throw new Error(
        `Cannot change severity from ${this._severity.value} to ${newSeverity.value}`,
      );
    }

    const oldSeverity = this._severity;
    this._severity = newSeverity;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new IncidentSeverityChangedEvent(
        this._id,
        oldSeverity.value,
        newSeverity.value,
      ),
    );
  }

  public startInvestigation(investigationLeadUserId: string): void {
    if (this._investigationStatus !== 'open') {
      throw new Error(
        `Cannot start investigation in status: ${this._investigationStatus}`,
      );
    }

    this._investigationStatus = 'investigating';
    this._investigationLeadUserId = investigationLeadUserId;
    this._investigationStartDate = new Date();
    this._updatedAt = new Date();
  }

  public completeInvestigation(lessonsLearned?: string): void {
    if (this._investigationStatus !== 'investigating') {
      throw new Error(
        `Cannot complete investigation in status: ${this._investigationStatus}`,
      );
    }

    this._investigationStatus = 'completed';
    this._investigationCompletionDate = new Date();
    if (lessonsLearned) {
      this._lessonsLearned = lessonsLearned;
    }
    this._updatedAt = new Date();
  }

  public close(_closedByUserId: string): void {
    if (this._status !== 'remediation') {
      throw new Error(`Cannot close incident in status: ${this._status}`);
    }

    this._status = 'closed';
    this._closureDate = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new IncidentStatusChangedEvent(this._id, 'remediation', 'closed'),
    );
  }

  public updateRootCauseAnalysis(
    analysis: Record<string, unknown>,
    _updatedByUserId: string,
  ): void {
    this._rootCauseAnalysis = analysis;
    this._updatedAt = new Date();
  }

  public updateEnvironmentalImpact(
    impact: Record<string, unknown>,
    _updatedByUserId: string,
  ): void {
    this._environmentalImpact = impact;
    this._updatedAt = new Date();
  }

  // Business logic queries
  public requiresImmediateNotification(): boolean {
    return (
      this._incidentType.requiresImmediateNotification() ||
      this._severity.requiresImmediateResponse()
    );
  }

  public requiresRegulatoryNotification(): boolean {
    return (
      this._regulatoryNotificationRequired ||
      this._severity.requiresRegulatoryNotification()
    );
  }

  public isOverdueForNotification(): boolean {
    if (!this._notificationDeadline) return false;
    return new Date() > this._notificationDeadline;
  }

  public requiresSeniorManagementNotification(): boolean {
    return this._severity.requiresSeniorManagementNotification();
  }

  public isHighPriority(): boolean {
    return (
      this._severity.value === 'critical' ||
      this._incidentType.isSafetyCritical()
    );
  }

  // Getters
  public get incidentNumber(): string {
    return this._incidentNumber;
  }

  public get incidentType(): IncidentType {
    return this._incidentType;
  }

  public get severity(): IncidentSeverity {
    return this._severity;
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get wellId(): string | undefined {
    return this._wellId;
  }

  public get incidentDate(): Date {
    return this._incidentDate;
  }

  public get discoveryDate(): Date | undefined {
    return this._discoveryDate;
  }

  public get location(): string {
    return this._location;
  }

  public get facilityId(): string | undefined {
    return this._facilityId;
  }

  public get description(): string {
    return this._description;
  }

  public get reportedByUserId(): string {
    return this._reportedByUserId;
  }

  public get affectedPersonnel(): Record<string, unknown>[] | undefined {
    return this._affectedPersonnel;
  }

  public get rootCauseAnalysis(): Record<string, unknown> | undefined {
    return this._rootCauseAnalysis;
  }

  public get contributingFactors(): Record<string, unknown>[] | undefined {
    return this._contributingFactors;
  }

  public get environmentalImpact(): Record<string, unknown> | undefined {
    return this._environmentalImpact;
  }

  public get propertyDamage(): number | undefined {
    return this._propertyDamage;
  }

  public get estimatedCost(): number | undefined {
    return this._estimatedCost;
  }

  public get reportableAgencies(): string[] | undefined {
    return this._reportableAgencies;
  }

  public get regulatoryNotificationRequired(): boolean {
    return this._regulatoryNotificationRequired;
  }

  public get notificationDeadline(): Date | undefined {
    return this._notificationDeadline;
  }

  public get investigationStatus(): string {
    return this._investigationStatus;
  }

  public get investigationLeadUserId(): string | undefined {
    return this._investigationLeadUserId;
  }

  public get investigationStartDate(): Date | undefined {
    return this._investigationStartDate;
  }

  public get investigationCompletionDate(): Date | undefined {
    return this._investigationCompletionDate;
  }

  public get status(): string {
    return this._status;
  }

  public get closureDate(): Date | undefined {
    return this._closureDate;
  }

  public get lessonsLearned(): string | undefined {
    return this._lessonsLearned;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters (used for reconstruction from persistence)
  public set incidentNumber(value: string) {
    this._incidentNumber = value;
  }

  public set incidentType(value: IncidentType) {
    this._incidentType = value;
  }

  public set severity(value: IncidentSeverity) {
    this._severity = value;
  }

  public set wellId(value: string | undefined) {
    this._wellId = value;
  }

  public set discoveryDate(value: Date | undefined) {
    this._discoveryDate = value;
  }

  public set facilityId(value: string | undefined) {
    this._facilityId = value;
  }

  public set affectedPersonnel(value: Record<string, unknown>[] | undefined) {
    this._affectedPersonnel = value;
  }

  public set rootCauseAnalysis(value: Record<string, unknown> | undefined) {
    this._rootCauseAnalysis = value;
  }

  public set contributingFactors(value: Record<string, unknown>[] | undefined) {
    this._contributingFactors = value;
  }

  public set environmentalImpact(value: Record<string, unknown> | undefined) {
    this._environmentalImpact = value;
  }

  public set propertyDamage(value: number | undefined) {
    this._propertyDamage = value;
  }

  public set estimatedCost(value: number | undefined) {
    this._estimatedCost = value;
  }

  public set reportableAgencies(value: string[] | undefined) {
    this._reportableAgencies = value;
  }

  public set regulatoryNotificationRequired(value: boolean) {
    this._regulatoryNotificationRequired = value;
  }

  public set notificationDeadline(value: Date | undefined) {
    this._notificationDeadline = value;
  }

  public set investigationStatus(value: string) {
    this._investigationStatus = value;
  }

  public set investigationLeadUserId(value: string | undefined) {
    this._investigationLeadUserId = value;
  }

  public set investigationStartDate(value: Date | undefined) {
    this._investigationStartDate = value;
  }

  public set investigationCompletionDate(value: Date | undefined) {
    this._investigationCompletionDate = value;
  }

  public set status(value: string) {
    this._status = value;
  }

  public set closureDate(value: Date | undefined) {
    this._closureDate = value;
  }

  public set lessonsLearned(value: string | undefined) {
    this._lessonsLearned = value;
  }

  public set createdAt(value: Date) {
    this._createdAt = value;
  }

  public set updatedAt(value: Date) {
    this._updatedAt = value;
  }
}
