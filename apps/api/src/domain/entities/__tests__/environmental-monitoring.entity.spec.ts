import { EnvironmentalMonitoring } from '../environmental-monitoring.entity';
import { MonitoringType } from '../../value-objects/monitoring-type.vo';
import { MonitoringDataRecordedEvent } from '../../events/monitoring-data-recorded.event';
import { ComplianceLimitExceededEvent } from '../../events/compliance-limit-exceeded.event';

describe('EnvironmentalMonitoring Entity', () => {
  const validId = 'monitoring-123';
  const validMonitoringPointId = 'point-456';
  const validOrganizationId = 'org-789';
  const validParameter = 'NOx';
  const validUnitOfMeasure = 'ppm';
  const validMonitoringDate = new Date('2024-01-15');
  const validUserId = 'user-101';

  describe('Constructor', () => {
    it('should create monitoring record with required fields', () => {
      const monitoringType = MonitoringType.AIR;

      const monitoring = new EnvironmentalMonitoring(
        validId,
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
      );

      expect(monitoring.id).toBe(validId);
      expect(monitoring.monitoringPointId).toBe(validMonitoringPointId);
      expect(monitoring.monitoringType).toBe(monitoringType);
      expect(monitoring.organizationId).toBe(validOrganizationId);
      expect(monitoring.parameter).toBe(validParameter);
      expect(monitoring.unitOfMeasure).toBe(validUnitOfMeasure);
      expect(monitoring.monitoringDate).toBe(validMonitoringDate);
      expect(monitoring.monitoredByUserId).toBe(validUserId);
      expect(monitoring.qaQcPerformed).toBe(false);
      expect(monitoring.reportRequired).toBe(false);
      expect(monitoring.followUpRequired).toBe(false);
      expect(monitoring.createdAt).toBeInstanceOf(Date);
      expect(monitoring.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Factory Method - create', () => {
    it('should create monitoring record with measured value and compliance limit', () => {
      const monitoringType = MonitoringType.WATER;
      const measuredValue = 5.2;
      const complianceLimit = 10.0;

      const monitoring = EnvironmentalMonitoring.create(
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
        measuredValue,
        complianceLimit,
      );

      expect(monitoring.monitoringType).toBe(monitoringType);
      expect(monitoring.measuredValue).toBe(measuredValue);
      expect(monitoring.complianceLimit).toBe(complianceLimit);
      expect(monitoring.isCompliant).toBe(true);

      const domainEvents = monitoring.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0]).toBeInstanceOf(MonitoringDataRecordedEvent);
      const event = domainEvents[0] as MonitoringDataRecordedEvent;
      expect(event.monitoringPointId).toBe(validMonitoringPointId);
      expect(event.parameter).toBe(validParameter);
      expect(event.measuredValue).toBe(measuredValue);
    });

    it('should create monitoring record and raise compliance exceeded event', () => {
      const monitoringType = MonitoringType.AIR;
      const measuredValue = 15.0;
      const complianceLimit = 10.0;

      const monitoring = EnvironmentalMonitoring.create(
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
        measuredValue,
        complianceLimit,
      );

      expect(monitoring.isCompliant).toBe(false);

      const domainEvents = monitoring.getDomainEvents();
      expect(domainEvents).toHaveLength(2);
      expect(domainEvents[0]).toBeInstanceOf(MonitoringDataRecordedEvent);
      expect(domainEvents[1]).toBeInstanceOf(ComplianceLimitExceededEvent);
      const exceedanceEvent = domainEvents[1] as ComplianceLimitExceededEvent;
      expect(exceedanceEvent.measuredValue).toBe(measuredValue);
      expect(exceedanceEvent.complianceLimit).toBe(complianceLimit);
    });
  });

  describe('Business Methods', () => {
    let monitoring: EnvironmentalMonitoring;

    beforeEach(() => {
      const monitoringType = MonitoringType.AIR;
      monitoring = new EnvironmentalMonitoring(
        validId,
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
      );
    });

    describe('recordMeasurement', () => {
      it('should record measurement and check compliance', () => {
        const measuredValue = 8.5;
        // Set compliance limit via private field for testing
        (monitoring as any)._complianceLimit = 10.0;

        monitoring.recordMeasurement(measuredValue, validUserId);

        expect(monitoring.measuredValue).toBe(measuredValue);
        expect(monitoring.isCompliant).toBe(true);

        const domainEvents = monitoring.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(MonitoringDataRecordedEvent);
      });

      it('should record measurement and raise exceedance event', () => {
        const measuredValue = 12.0;
        // Set compliance limit via private field for testing
        (monitoring as any)._complianceLimit = 10.0;

        monitoring.recordMeasurement(measuredValue, validUserId);

        expect(monitoring.isCompliant).toBe(false);

        const domainEvents = monitoring.getDomainEvents();
        expect(domainEvents).toHaveLength(2);
        expect(domainEvents[1]).toBeInstanceOf(ComplianceLimitExceededEvent);
      });
    });

    describe('performQaQc', () => {
      it('should perform QA/QC review', () => {
        const qaQcMethod = 'duplicate analysis';
        const dataQualityIndicator = 'A';

        monitoring.performQaQc(qaQcMethod, dataQualityIndicator, validUserId);

        expect(monitoring.qaQcPerformed).toBe(true);
        expect(monitoring.qaQcMethod).toBe(qaQcMethod);
        expect(monitoring.dataQualityIndicator).toBe(dataQualityIndicator);
        expect(monitoring.reviewedByUserId).toBe(validUserId);
      });
    });

    describe('scheduleCalibration', () => {
      it('should schedule calibration', () => {
        const nextCalibrationDate = new Date('2024-06-01');

        monitoring.scheduleCalibration(nextCalibrationDate, validUserId);

        expect(monitoring.nextCalibrationDate).toBe(nextCalibrationDate);
        expect(monitoring.calibrationDate).toBeInstanceOf(Date);
      });
    });

    describe('submitReport', () => {
      it('should submit report', () => {
        const reportNumber = 'RPT-2024-001';
        const reportedDate = new Date('2024-01-20');

        monitoring.submitReport(reportNumber, reportedDate, validUserId);

        expect(monitoring.reportNumber).toBe(reportNumber);
        expect(monitoring.reportedDate).toBe(reportedDate);
      });
    });

    describe('addCorrectiveAction', () => {
      it('should add corrective action', () => {
        const action = { description: 'Install scrubber', priority: 'high' };

        monitoring.addCorrectiveAction(action, validUserId);

        const actions = monitoring.correctiveActions as any[];
        expect(actions).toBeDefined();
        expect(actions).toHaveLength(1);
        expect(actions[0].description).toBe('Install scrubber');
        expect(actions[0].addedBy).toBe(validUserId);
        expect(actions[0].addedDate).toBeInstanceOf(Date);
      });

      it('should initialize corrective actions array if undefined', () => {
        monitoring.addCorrectiveAction(
          { description: 'Test action' },
          validUserId,
        );

        expect(monitoring.correctiveActions).toBeDefined();
        expect(monitoring.correctiveActions!).toHaveLength(1);
      });
    });

    describe('setValidationResult', () => {
      it('should set validation result', () => {
        const errors = [{ field: 'value', message: 'Invalid range' }];

        monitoring.setValidationResult('invalid', errors);

        expect(monitoring.getValidationStatus()).toBe('invalid');
        expect(monitoring.getValidationErrors()).toBe(errors);
      });
    });
  });

  describe('Business Logic Queries', () => {
    let monitoring: EnvironmentalMonitoring;

    beforeEach(() => {
      const monitoringType = MonitoringType.AIR;
      monitoring = new EnvironmentalMonitoring(
        validId,
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
      );
    });

    describe('isExceedance', () => {
      it('should return true when measured value exceeds threshold', () => {
        (monitoring as any)._measuredValue = 15.0;
        (monitoring as any)._exceedanceThreshold = 10.0;

        expect(monitoring.isExceedance()).toBe(true);
      });

      it('should return false when below threshold', () => {
        (monitoring as any)._measuredValue = 8.0;
        (monitoring as any)._exceedanceThreshold = 10.0;

        expect(monitoring.isExceedance()).toBe(false);
      });

      it('should return false when no threshold set', () => {
        (monitoring as any)._measuredValue = 15.0;

        expect(monitoring.isExceedance()).toBe(false);
      });
    });

    describe('isComplianceViolation', () => {
      it('should return true when not compliant', () => {
        (monitoring as any)._isCompliant = false;

        expect(monitoring.isComplianceViolation()).toBe(true);
      });

      it('should return false when compliant', () => {
        (monitoring as any)._isCompliant = true;

        expect(monitoring.isComplianceViolation()).toBe(false);
      });
    });

    describe('requiresCalibration', () => {
      it('should return true when calibration due within 30 days', () => {
        const soon = new Date();
        soon.setDate(soon.getDate() + 15);
        monitoring.nextCalibrationDate = soon;

        expect(monitoring.requiresCalibration()).toBe(true);
      });

      it('should return false when calibration not due soon', () => {
        const future = new Date();
        future.setDate(future.getDate() + 60);
        monitoring.nextCalibrationDate = future;

        expect(monitoring.requiresCalibration()).toBe(false);
      });

      it('should return false when no calibration date set', () => {
        expect(monitoring.requiresCalibration()).toBe(false);
      });
    });

    describe('isOverdueForReporting', () => {
      it('should return true when past due date and not reported', () => {
        monitoring.dueDate = new Date('2023-01-01');

        expect(monitoring.isOverdueForReporting()).toBe(true);
      });

      it('should return false when reported', () => {
        monitoring.dueDate = new Date('2023-01-01');
        monitoring.reportedDate = new Date('2023-01-02');

        expect(monitoring.isOverdueForReporting()).toBe(false);
      });

      it('should return false when not past due date', () => {
        monitoring.dueDate = new Date('2026-01-01');

        expect(monitoring.isOverdueForReporting()).toBe(false);
      });
    });

    describe('requiresQaQcReview', () => {
      it('should return true when QA/QC not performed and is exceedance', () => {
        (monitoring as any)._qaQcPerformed = false;
        (monitoring as any)._measuredValue = 15.0;
        (monitoring as any)._exceedanceThreshold = 10.0;

        expect(monitoring.requiresQaQcReview()).toBe(true);
      });

      it('should return false when QA/QC already performed', () => {
        (monitoring as any)._qaQcPerformed = true;
        (monitoring as any)._measuredValue = 15.0;
        (monitoring as any)._exceedanceThreshold = 10.0;

        expect(monitoring.requiresQaQcReview()).toBe(false);
      });

      it('should return false when not an exceedance', () => {
        (monitoring as any)._qaQcPerformed = false;
        (monitoring as any)._measuredValue = 8.0;
        (monitoring as any)._exceedanceThreshold = 10.0;

        expect(monitoring.requiresQaQcReview()).toBe(false);
      });
    });

    describe('getComplianceStatus', () => {
      it('should return compliant when isCompliant is true', () => {
        (monitoring as any)._isCompliant = true;

        expect(monitoring.getComplianceStatus()).toBe('compliant');
      });

      it('should return non-compliant when isCompliant is false', () => {
        (monitoring as any)._isCompliant = false;

        expect(monitoring.getComplianceStatus()).toBe('non-compliant');
      });

      it('should return unknown when isCompliant is undefined', () => {
        (monitoring as any)._isCompliant = undefined;

        expect(monitoring.getComplianceStatus()).toBe('unknown');
      });
    });
  });

  describe('Getters and Setters', () => {
    let monitoring: EnvironmentalMonitoring;

    beforeEach(() => {
      const monitoringType = MonitoringType.AIR;
      monitoring = new EnvironmentalMonitoring(
        validId,
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
      );
    });

    it('should get and set monitoringPointId', () => {
      const newId = 'point-789';
      monitoring.monitoringPointId = newId;
      expect(monitoring.monitoringPointId).toBe(newId);
    });

    it('should get and set monitoringType', () => {
      const newType = MonitoringType.WATER;
      monitoring.monitoringType = newType;
      expect(monitoring.monitoringType).toBe(newType);
    });

    it('should get and set wellId', () => {
      const wellId = 'well-123';
      monitoring.wellId = wellId;
      expect(monitoring.wellId).toBe(wellId);
    });

    it('should get and set location', () => {
      const location = 'North Tank Farm';
      (monitoring as any)._location = location;
      expect(monitoring.location).toBe(location);
    });

    it('should get and set facilityId', () => {
      const facilityId = 'facility-456';
      monitoring.facilityId = facilityId;
      expect(monitoring.facilityId).toBe(facilityId);
    });

    it('should get and set equipmentId', () => {
      const equipmentId = 'equip-789';
      monitoring.equipmentId = equipmentId;
      expect(monitoring.equipmentId).toBe(equipmentId);
    });

    it('should get and set detectionLimit', () => {
      const limit = 0.1;
      monitoring.detectionLimit = limit;
      expect(monitoring.detectionLimit).toBe(limit);
    });

    it('should get and set exceedanceThreshold', () => {
      const threshold = 20.0;
      monitoring.exceedanceThreshold = threshold;
      expect(monitoring.exceedanceThreshold).toBe(threshold);
    });

    it('should get and set regulatoryStandard', () => {
      const standard = 'EPA-40-CFR-60';
      monitoring.regulatoryStandard = standard;
      expect(monitoring.regulatoryStandard).toBe(standard);
    });

    it('should get and set monitoringMethod', () => {
      const method = 'Continuous Emission Monitoring';
      monitoring.monitoringMethod = method;
      expect(monitoring.monitoringMethod).toBe(method);
    });

    it('should get and set equipmentType', () => {
      const type = 'CEMS';
      monitoring.equipmentType = type;
      expect(monitoring.equipmentType).toBe(type);
    });

    it('should get and set equipmentSerialNumber', () => {
      const serial = 'CEMS-001';
      monitoring.equipmentSerialNumber = serial;
      expect(monitoring.equipmentSerialNumber).toBe(serial);
    });

    it('should get and set calibrationDate', () => {
      const date = new Date('2024-01-01');
      monitoring.calibrationDate = date;
      expect(monitoring.calibrationDate).toBe(date);
    });

    it('should get and set nextCalibrationDate', () => {
      const date = new Date('2024-07-01');
      monitoring.nextCalibrationDate = date;
      expect(monitoring.nextCalibrationDate).toBe(date);
    });

    it('should get and set qaQcMethod', () => {
      const method = 'Standard Method';
      monitoring.qaQcMethod = method;
      expect(monitoring.qaQcMethod).toBe(method);
    });

    it('should get and set dataQualityIndicator', () => {
      const indicator = 'A';
      monitoring.dataQualityIndicator = indicator;
      expect(monitoring.dataQualityIndicator).toBe(indicator);
    });

    it('should get and set weatherConditions', () => {
      const conditions = { temperature: 25, humidity: 60 };
      monitoring.weatherConditions = conditions;
      expect(monitoring.weatherConditions).toBe(conditions);
    });

    it('should get and set operationalConditions', () => {
      const conditions = { pressure: 30, flowRate: 100 };
      monitoring.operationalConditions = conditions;
      expect(monitoring.operationalConditions).toBe(conditions);
    });

    it('should get and set reportingPeriod', () => {
      const period = 'Q1-2024';
      monitoring.reportingPeriod = period;
      expect(monitoring.reportingPeriod).toBe(period);
    });

    it('should get and set dueDate', () => {
      const date = new Date('2024-02-01');
      monitoring.dueDate = date;
      expect(monitoring.dueDate).toBe(date);
    });

    it('should get and set reportedDate', () => {
      const date = new Date('2024-01-20');
      monitoring.reportedDate = date;
      expect(monitoring.reportedDate).toBe(date);
    });

    it('should get and set reportNumber', () => {
      const number = 'RPT-2024-001';
      monitoring.reportNumber = number;
      expect(monitoring.reportNumber).toBe(number);
    });

    it('should get and set correctiveActions', () => {
      const actions = [{ description: 'Action 1' }];
      monitoring.correctiveActions = actions;
      expect(monitoring.correctiveActions).toBe(actions);
    });

    it('should get and set followUpDate', () => {
      const date = new Date('2024-02-15');
      monitoring.followUpDate = date;
      expect(monitoring.followUpDate).toBe(date);
    });

    it('should get and set reviewedByUserId', () => {
      monitoring.reviewedByUserId = validUserId;
      expect(monitoring.reviewedByUserId).toBe(validUserId);
    });

    it('should get and set createdAt', () => {
      const date = new Date('2024-01-10');
      monitoring.createdAt = date;
      expect(monitoring.createdAt).toBe(date);
    });

    it('should get and set updatedAt', () => {
      const date = new Date('2024-01-16');
      monitoring.updatedAt = date;
      expect(monitoring.updatedAt).toBe(date);
    });
  });

  describe('Entity Interface', () => {
    it('should implement getId method', () => {
      const monitoringType = MonitoringType.AIR;
      const monitoring = new EnvironmentalMonitoring(
        validId,
        validMonitoringPointId,
        monitoringType,
        validOrganizationId,
        validParameter,
        validUnitOfMeasure,
        validMonitoringDate,
        validUserId,
      );

      const id = monitoring.getId();
      expect(id.getValue()).toBe(validId);
    });
  });
});
