import { AggregateRoot } from '../shared/aggregate-root';
import { MonitoringType } from '../value-objects/monitoring-type.vo';
import { MonitoringDataRecordedEvent } from '../events/monitoring-data-recorded.event';
import { ComplianceLimitExceededEvent } from '../events/compliance-limit-exceeded.event';

/**
 * Environmental Monitoring Aggregate Root
 * Represents environmental monitoring data with compliance tracking and exceedance detection
 */
export class EnvironmentalMonitoring extends AggregateRoot {
  private readonly _id: string;
  private _monitoringPointId: string;
  private _monitoringType: MonitoringType;
  private _organizationId: string;
  private _wellId?: string;

  // Location and facility
  private _location?: string;
  private _facilityId?: string;
  private _equipmentId?: string;

  // Monitoring parameters
  private _parameter: string;
  private _unitOfMeasure: string;

  // Monitoring data
  private _monitoringDate: Date;
  private _measuredValue?: number;
  private _detectionLimit?: number;
  private _exceedanceThreshold?: number;

  // Regulatory compliance
  private _regulatoryStandard?: string;
  private _complianceLimit?: number;
  private _isCompliant?: boolean;

  // Monitoring method and equipment
  private _monitoringMethod?: string;
  private _equipmentType?: string;
  private _equipmentSerialNumber?: string;
  private _calibrationDate?: Date;
  private _nextCalibrationDate?: Date;

  // Quality assurance
  private _qaQcPerformed: boolean;
  private _qaQcMethod?: string;
  private _dataQualityIndicator?: string;

  // Environmental conditions
  private _weatherConditions?: Record<string, unknown>;
  private _operationalConditions?: Record<string, unknown>;

  // Reporting and notifications
  private _reportRequired: boolean;
  private _reportingPeriod?: string;
  private _dueDate?: Date;
  private _reportedDate?: Date;
  private _reportNumber?: string;

  // Actions and follow-up
  private _correctiveActions?: Record<string, unknown>[];
  private _followUpRequired: boolean;
  private _followUpDate?: Date;

  // Validation fields
  private _validationStatus?: string;
  private _validationErrors?: Record<string, unknown>[];

  // Audit fields
  private _monitoredByUserId: string;
  private _reviewedByUserId?: string;
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
    monitoringPointId: string,
    monitoringType: MonitoringType,
    organizationId: string,
    parameter: string,
    unitOfMeasure: string,
    monitoringDate: Date,
    monitoredByUserId: string,
  ) {
    super();
    this._id = id;
    this._monitoringPointId = monitoringPointId;
    this._monitoringType = monitoringType;
    this._organizationId = organizationId;
    this._parameter = parameter;
    this._unitOfMeasure = unitOfMeasure;
    this._monitoringDate = monitoringDate;
    this._monitoredByUserId = monitoredByUserId;
    this._qaQcPerformed = false;
    this._reportRequired = false;
    this._followUpRequired = false;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Factory method for creating new monitoring records
  public static create(
    monitoringPointId: string,
    monitoringType: MonitoringType,
    organizationId: string,
    parameter: string,
    unitOfMeasure: string,
    monitoringDate: Date,
    monitoredByUserId: string,
    measuredValue?: number,
    complianceLimit?: number,
  ): EnvironmentalMonitoring {
    const monitoring = new EnvironmentalMonitoring(
      crypto.randomUUID(), // Generate ID
      monitoringPointId,
      monitoringType,
      organizationId,
      parameter,
      unitOfMeasure,
      monitoringDate,
      monitoredByUserId,
    );

    // Set optional values
    if (measuredValue !== undefined) {
      monitoring._measuredValue = measuredValue;
    }

    // Raise domain event for data recording
    monitoring.addDomainEvent(
      new MonitoringDataRecordedEvent(
        monitoring._id,
        monitoringPointId,
        parameter,
        measuredValue,
      ),
    );

    if (complianceLimit !== undefined) {
      monitoring._complianceLimit = complianceLimit;
      monitoring.checkCompliance(measuredValue);
    }

    return monitoring;
  }

  // Business methods
  public recordMeasurement(
    measuredValue: number,
    _updatedByUserId: string,
  ): void {
    this._measuredValue = measuredValue;
    this._updatedAt = new Date();

    // Raise domain event for data recording
    this.addDomainEvent(
      new MonitoringDataRecordedEvent(
        this._id,
        this._monitoringPointId,
        this._parameter,
        measuredValue,
      ),
    );

    // Check for compliance violations
    this.checkCompliance(measuredValue);
  }

  private checkCompliance(measuredValue?: number): void {
    if (this._complianceLimit !== undefined && measuredValue !== undefined) {
      const isCompliant = measuredValue <= this._complianceLimit;
      this._isCompliant = isCompliant;

      // Raise event if compliance limit is exceeded
      if (!isCompliant) {
        this.addDomainEvent(
          new ComplianceLimitExceededEvent(
            this._id,
            this._monitoringPointId,
            this._parameter,
            measuredValue,
            this._complianceLimit,
          ),
        );
      }
    }
  }

  public performQaQc(
    qaQcMethod: string,
    dataQualityIndicator: string,
    reviewedByUserId: string,
  ): void {
    this._qaQcPerformed = true;
    this._qaQcMethod = qaQcMethod;
    this._dataQualityIndicator = dataQualityIndicator;
    this._reviewedByUserId = reviewedByUserId;
    this._updatedAt = new Date();
  }

  public scheduleCalibration(
    nextCalibrationDate: Date,
    _updatedByUserId: string,
  ): void {
    this._nextCalibrationDate = nextCalibrationDate;
    this._calibrationDate = new Date(); // Current calibration date
    this._updatedAt = new Date();
  }

  public submitReport(
    reportNumber: string,
    reportedDate: Date,
    _submittedByUserId: string,
  ): void {
    this._reportNumber = reportNumber;
    this._reportedDate = reportedDate;
    this._updatedAt = new Date();
  }

  public addCorrectiveAction(
    action: Record<string, unknown>,
    updatedByUserId: string,
  ): void {
    if (!this._correctiveActions) {
      this._correctiveActions = [];
    }

    this._correctiveActions.push({
      ...action,
      addedDate: new Date(),
      addedBy: updatedByUserId,
    });

    this._updatedAt = new Date();
  }

  // Business logic queries
  public isExceedance(): boolean {
    if (!this._measuredValue || !this._exceedanceThreshold) return false;
    return this._measuredValue > this._exceedanceThreshold;
  }

  public isComplianceViolation(): boolean {
    return this._isCompliant === false;
  }

  public requiresCalibration(): boolean {
    if (!this._nextCalibrationDate) return false;
    // Require calibration if next date is within 30 days
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 30);
    return this._nextCalibrationDate <= warningDate;
  }

  public isOverdueForReporting(): boolean {
    if (!this._dueDate) return false;
    return new Date() > this._dueDate && !this._reportedDate;
  }

  public requiresQaQcReview(): boolean {
    return !this._qaQcPerformed && this.isExceedance();
  }

  public getComplianceStatus(): 'compliant' | 'non-compliant' | 'unknown' {
    if (this._isCompliant === undefined) return 'unknown';
    return this._isCompliant ? 'compliant' : 'non-compliant';
  }

  // Validation methods
  public setValidationResult(
    status: string,
    errors?: Record<string, unknown>[],
  ): void {
    this._validationStatus = status;
    this._validationErrors = errors;
    this._updatedAt = new Date();
  }

  public getValidationStatus(): string | undefined {
    return this._validationStatus;
  }

  public getValidationErrors(): Record<string, unknown>[] | undefined {
    return this._validationErrors;
  }

  // Getters
  public get monitoringPointId(): string {
    return this._monitoringPointId;
  }

  public get monitoringType(): MonitoringType {
    return this._monitoringType;
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get wellId(): string | undefined {
    return this._wellId;
  }

  public get location(): string | undefined {
    return this._location;
  }

  public get facilityId(): string | undefined {
    return this._facilityId;
  }

  public get equipmentId(): string | undefined {
    return this._equipmentId;
  }

  public get parameter(): string {
    return this._parameter;
  }

  public get unitOfMeasure(): string {
    return this._unitOfMeasure;
  }

  public get monitoringDate(): Date {
    return this._monitoringDate;
  }

  public get measuredValue(): number | undefined {
    return this._measuredValue;
  }

  public get detectionLimit(): number | undefined {
    return this._detectionLimit;
  }

  public get exceedanceThreshold(): number | undefined {
    return this._exceedanceThreshold;
  }

  public get regulatoryStandard(): string | undefined {
    return this._regulatoryStandard;
  }

  public get monitoringMethod(): string | undefined {
    return this._monitoringMethod;
  }

  public get equipmentType(): string | undefined {
    return this._equipmentType;
  }

  public get equipmentSerialNumber(): string | undefined {
    return this._equipmentSerialNumber;
  }

  public get calibrationDate(): Date | undefined {
    return this._calibrationDate;
  }

  public get nextCalibrationDate(): Date | undefined {
    return this._nextCalibrationDate;
  }

  public get qaQcMethod(): string | undefined {
    return this._qaQcMethod;
  }

  public get dataQualityIndicator(): string | undefined {
    return this._dataQualityIndicator;
  }

  public get weatherConditions(): Record<string, unknown> | undefined {
    return this._weatherConditions;
  }

  public get operationalConditions(): Record<string, unknown> | undefined {
    return this._operationalConditions;
  }

  public get reportingPeriod(): string | undefined {
    return this._reportingPeriod;
  }

  public get complianceLimit(): number | undefined {
    return this._complianceLimit;
  }

  public get isCompliant(): boolean | undefined {
    return this._isCompliant;
  }

  public get qaQcPerformed(): boolean {
    return this._qaQcPerformed;
  }

  public get reportRequired(): boolean {
    return this._reportRequired;
  }

  public get dueDate(): Date | undefined {
    return this._dueDate;
  }

  public get reportedDate(): Date | undefined {
    return this._reportedDate;
  }

  public get reportNumber(): string | undefined {
    return this._reportNumber;
  }

  public get correctiveActions(): Record<string, unknown>[] | undefined {
    return this._correctiveActions;
  }

  public get followUpDate(): Date | undefined {
    return this._followUpDate;
  }

  public get followUpRequired(): boolean {
    return this._followUpRequired;
  }

  public get monitoredByUserId(): string {
    return this._monitoredByUserId;
  }

  public get reviewedByUserId(): string | undefined {
    return this._reviewedByUserId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters (used for reconstruction from persistence)
  public set monitoringPointId(value: string) {
    this._monitoringPointId = value;
  }

  public set monitoringType(value: MonitoringType) {
    this._monitoringType = value;
  }

  public set wellId(value: string | undefined) {
    this._wellId = value;
  }

  public set location(value: string | undefined) {
    this._location = value;
  }

  public set facilityId(value: string | undefined) {
    this._facilityId = value;
  }

  public set equipmentId(value: string | undefined) {
    this._equipmentId = value;
  }

  public set detectionLimit(value: number | undefined) {
    this._detectionLimit = value;
  }

  public set exceedanceThreshold(value: number | undefined) {
    this._exceedanceThreshold = value;
  }

  public set regulatoryStandard(value: string | undefined) {
    this._regulatoryStandard = value;
  }

  public set monitoringMethod(value: string | undefined) {
    this._monitoringMethod = value;
  }

  public set equipmentType(value: string | undefined) {
    this._equipmentType = value;
  }

  public set equipmentSerialNumber(value: string | undefined) {
    this._equipmentSerialNumber = value;
  }

  public set calibrationDate(value: Date | undefined) {
    this._calibrationDate = value;
  }

  public set nextCalibrationDate(value: Date | undefined) {
    this._nextCalibrationDate = value;
  }

  public set qaQcMethod(value: string | undefined) {
    this._qaQcMethod = value;
  }

  public set dataQualityIndicator(value: string | undefined) {
    this._dataQualityIndicator = value;
  }

  public set weatherConditions(value: Record<string, unknown> | undefined) {
    this._weatherConditions = value;
  }

  public set operationalConditions(value: Record<string, unknown> | undefined) {
    this._operationalConditions = value;
  }

  public set reportingPeriod(value: string | undefined) {
    this._reportingPeriod = value;
  }

  public set dueDate(value: Date | undefined) {
    this._dueDate = value;
  }

  public set reportedDate(value: Date | undefined) {
    this._reportedDate = value;
  }

  public set reportNumber(value: string | undefined) {
    this._reportNumber = value;
  }

  public set correctiveActions(value: Record<string, unknown>[] | undefined) {
    this._correctiveActions = value;
  }

  public set followUpDate(value: Date | undefined) {
    this._followUpDate = value;
  }

  public set reviewedByUserId(value: string | undefined) {
    this._reviewedByUserId = value;
  }

  public set createdAt(value: Date) {
    this._createdAt = value;
  }

  public set updatedAt(value: Date) {
    this._updatedAt = value;
  }
}
