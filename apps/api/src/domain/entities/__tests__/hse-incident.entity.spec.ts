import { HSEIncident } from '../hse-incident.entity';
import { IncidentType } from '../../value-objects/incident-type.vo';
import { IncidentSeverity } from '../../value-objects/incident-severity.vo';
import { IncidentReportedEvent } from '../../events/incident-reported.event';
import { IncidentStatusChangedEvent } from '../../events/incident-status-changed.event';
import { IncidentSeverityChangedEvent } from '../../events/incident-severity-changed.event';

describe('HSEIncident Entity', () => {
  const validId = 'incident-123';
  const validIncidentNumber = 'INC-2024-001';
  const validOrganizationId = 'org-456';
  const validLocation = 'Well Site A';
  const validDescription = 'Equipment failure during drilling operation';
  const validUserId = 'user-789';
  const validIncidentDate = new Date('2024-01-15');

  describe('Constructor', () => {
    it('should create incident with required fields', () => {
      const incidentType = IncidentType.EQUIPMENT_FAILURE;
      const severity = IncidentSeverity.MEDIUM;

      const incident = new HSEIncident(
        validId,
        validIncidentNumber,
        incidentType,
        severity,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );

      expect(incident.id).toBe(validId);
      expect(incident.incidentNumber).toBe(validIncidentNumber);
      expect(incident.incidentType).toBe(incidentType);
      expect(incident.severity).toBe(severity);
      expect(incident.organizationId).toBe(validOrganizationId);
      expect(incident.incidentDate).toBe(validIncidentDate);
      expect(incident.location).toBe(validLocation);
      expect(incident.description).toBe(validDescription);
      expect(incident.reportedByUserId).toBe(validUserId);
      expect(incident.regulatoryNotificationRequired).toBe(false);
      expect(incident.investigationStatus).toBe('open');
      expect(incident.status).toBe('open');
      expect(incident.createdAt).toBeInstanceOf(Date);
      expect(incident.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Factory Method - create', () => {
    it('should create incident and raise domain event', () => {
      const incidentType = IncidentType.SPILL;
      const severity = IncidentSeverity.HIGH;

      const incident = HSEIncident.create(
        validIncidentNumber,
        incidentType,
        severity,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );

      expect(incident.incidentNumber).toBe(validIncidentNumber);
      expect(incident.incidentType).toBe(incidentType);
      expect(incident.severity).toBe(severity);
      expect(incident.status).toBe('open');

      const domainEvents = incident.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0]).toBeInstanceOf(IncidentReportedEvent);
      const event = domainEvents[0] as IncidentReportedEvent;
      expect(event.incidentNumber).toBe(validIncidentNumber);
      expect(event.incidentType).toBe(incidentType.value);
      expect(event.severity).toBe(severity.value);
    });
  });

  describe('Business Methods', () => {
    let incident: HSEIncident;

    beforeEach(() => {
      const incidentType = IncidentType.EQUIPMENT_FAILURE;
      incident = new HSEIncident(
        validId,
        validIncidentNumber,
        incidentType,
        IncidentSeverity.MEDIUM,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );
    });

    describe('updateSeverity', () => {
      it('should update severity and raise domain event', () => {
        const newSeverity = IncidentSeverity.HIGH;

        incident.updateSeverity(newSeverity, validUserId);

        expect(incident.severity).toBe(newSeverity);
        expect(incident.updatedAt).toBeInstanceOf(Date);

        const domainEvents = incident.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(IncidentSeverityChangedEvent);
        const event = domainEvents[0] as IncidentSeverityChangedEvent;
        expect(event.oldSeverity).toBe('medium');
        expect(event.newSeverity).toBe('high');
      });

      it('should allow upgrading severity', () => {
        const newSeverity = IncidentSeverity.CRITICAL;

        expect(() => {
          incident.updateSeverity(newSeverity, validUserId);
        }).not.toThrow();
      });

      it('should throw error for downgrading severity', () => {
        const newSeverity = IncidentSeverity.LOW;

        expect(() => {
          incident.updateSeverity(newSeverity, validUserId);
        }).toThrow('Cannot change severity from medium to low');
      });
    });

    describe('startInvestigation', () => {
      it('should start investigation', () => {
        incident.startInvestigation(validUserId);

        expect(incident.investigationStatus).toBe('investigating');
        expect(incident.investigationLeadUserId).toBe(validUserId);
        expect(incident.investigationStartDate).toBeInstanceOf(Date);
      });

      it('should throw error if investigation already started', () => {
        incident.startInvestigation(validUserId);
        incident.investigationStatus = 'completed';

        expect(() => {
          incident.startInvestigation('user-2');
        }).toThrow('Cannot start investigation in status: completed');
      });
    });

    describe('completeInvestigation', () => {
      beforeEach(() => {
        incident.startInvestigation(validUserId);
      });

      it('should complete investigation with lessons learned', () => {
        const lessons = 'Implement additional safety checks';

        incident.completeInvestigation(lessons);

        expect(incident.investigationStatus).toBe('completed');
        expect(incident.investigationCompletionDate).toBeInstanceOf(Date);
        expect(incident.lessonsLearned).toBe(lessons);
      });

      it('should complete investigation without lessons learned', () => {
        incident.completeInvestigation();

        expect(incident.investigationStatus).toBe('completed');
        expect(incident.lessonsLearned).toBeUndefined();
      });

      it('should throw error if investigation not started', () => {
        const newIncident = new HSEIncident(
          'id2',
          'INC-002',
          IncidentType.SPILL,
          IncidentSeverity.LOW,
          validOrganizationId,
          validIncidentDate,
          validLocation,
          validDescription,
          validUserId,
        );

        expect(() => {
          newIncident.completeInvestigation();
        }).toThrow('Cannot complete investigation in status: open');
      });
    });

    describe('close', () => {
      beforeEach(() => {
        incident.status = 'remediation';
      });

      it('should close incident and raise domain event', () => {
        incident.close(validUserId);

        expect(incident.status).toBe('closed');
        expect(incident.closureDate).toBeInstanceOf(Date);

        const domainEvents = incident.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(IncidentStatusChangedEvent);
        const event = domainEvents[0] as IncidentStatusChangedEvent;
        expect(event.oldStatus).toBe('remediation');
        expect(event.newStatus).toBe('closed');
      });

      it('should throw error if not in remediation status', () => {
        incident.status = 'open';

        expect(() => {
          incident.close(validUserId);
        }).toThrow('Cannot close incident in status: open');
      });
    });

    describe('updateRootCauseAnalysis', () => {
      it('should update root cause analysis', () => {
        const analysis = {
          cause: 'Human error',
          factors: ['fatigue', 'training'],
        };

        incident.updateRootCauseAnalysis(analysis, validUserId);

        expect(incident.rootCauseAnalysis).toBe(analysis);
      });
    });

    describe('updateEnvironmentalImpact', () => {
      it('should update environmental impact', () => {
        const impact = { affectedArea: '100 sq meters', cleanupRequired: true };

        incident.updateEnvironmentalImpact(impact, validUserId);

        expect(incident.environmentalImpact).toBe(impact);
      });
    });
  });

  describe('Business Logic Queries', () => {
    let incident: HSEIncident;

    beforeEach(() => {
      const incidentType = IncidentType.EQUIPMENT_FAILURE;
      incident = new HSEIncident(
        validId,
        validIncidentNumber,
        incidentType,
        IncidentSeverity.MEDIUM,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );
    });

    describe('requiresImmediateNotification', () => {
      it('should return true for critical incident types', () => {
        const criticalIncident = new HSEIncident(
          'id2',
          'INC-002',
          IncidentType.FIRE,
          IncidentSeverity.HIGH,
          validOrganizationId,
          validIncidentDate,
          validLocation,
          validDescription,
          validUserId,
        );

        expect(criticalIncident.requiresImmediateNotification()).toBe(true);
      });

      it('should return true for high severity', () => {
        incident.severity = IncidentSeverity.CRITICAL;

        expect(incident.requiresImmediateNotification()).toBe(true);
      });

      it('should return false for low severity equipment failure', () => {
        expect(incident.requiresImmediateNotification()).toBe(false);
      });
    });

    describe('requiresRegulatoryNotification', () => {
      it('should return true when regulatory notification required', () => {
        incident.regulatoryNotificationRequired = true;

        expect(incident.requiresRegulatoryNotification()).toBe(true);
      });

      it('should return true for medium severity and above', () => {
        expect(incident.requiresRegulatoryNotification()).toBe(true); // medium
      });

      it('should return false for low severity', () => {
        incident.severity = IncidentSeverity.LOW;

        expect(incident.requiresRegulatoryNotification()).toBe(false);
      });
    });

    describe('isOverdueForNotification', () => {
      it('should return true when past notification deadline', () => {
        incident.notificationDeadline = new Date('2023-01-01');

        expect(incident.isOverdueForNotification()).toBe(true);
      });

      it('should return false when no deadline', () => {
        expect(incident.isOverdueForNotification()).toBe(false);
      });

      it('should return false when before deadline', () => {
        incident.notificationDeadline = new Date('2026-01-01');

        expect(incident.isOverdueForNotification()).toBe(false);
      });
    });

    describe('requiresSeniorManagementNotification', () => {
      it('should return true for high severity', () => {
        incident.severity = IncidentSeverity.HIGH;

        expect(incident.requiresSeniorManagementNotification()).toBe(true);
      });

      it('should return false for low severity', () => {
        incident.severity = IncidentSeverity.LOW;

        expect(incident.requiresSeniorManagementNotification()).toBe(false);
      });
    });

    describe('isHighPriority', () => {
      it('should return true for critical severity', () => {
        incident.severity = IncidentSeverity.CRITICAL;

        expect(incident.isHighPriority()).toBe(true);
      });

      it('should return true for safety critical incident types', () => {
        const safetyIncident = new HSEIncident(
          'id2',
          'INC-002',
          IncidentType.FATALITY,
          IncidentSeverity.LOW,
          validOrganizationId,
          validIncidentDate,
          validLocation,
          validDescription,
          validUserId,
        );

        expect(safetyIncident.isHighPriority()).toBe(true);
      });

      it('should return false for low priority incidents', () => {
        incident.severity = IncidentSeverity.LOW;
        incident.incidentType = IncidentType.NEAR_MISS;

        expect(incident.isHighPriority()).toBe(false);
      });
    });
  });

  describe('Getters and Setters', () => {
    let incident: HSEIncident;

    beforeEach(() => {
      const incidentType = IncidentType.EQUIPMENT_FAILURE;
      incident = new HSEIncident(
        validId,
        validIncidentNumber,
        incidentType,
        IncidentSeverity.MEDIUM,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );
    });

    it('should get and set incidentNumber', () => {
      const newNumber = 'INC-2024-002';
      incident.incidentNumber = newNumber;
      expect(incident.incidentNumber).toBe(newNumber);
    });

    it('should get and set incidentType', () => {
      const newType = IncidentType.SPILL;
      incident.incidentType = newType;
      expect(incident.incidentType).toBe(newType);
    });

    it('should get and set severity', () => {
      const newSeverity = IncidentSeverity.HIGH;
      incident.severity = newSeverity;
      expect(incident.severity).toBe(newSeverity);
    });

    it('should get and set wellId', () => {
      const wellId = 'well-123';
      incident.wellId = wellId;
      expect(incident.wellId).toBe(wellId);
    });

    it('should get and set discoveryDate', () => {
      const date = new Date('2024-01-16');
      incident.discoveryDate = date;
      expect(incident.discoveryDate).toBe(date);
    });

    it('should get and set facilityId', () => {
      const facilityId = 'facility-123';
      incident.facilityId = facilityId;
      expect(incident.facilityId).toBe(facilityId);
    });

    it('should get and set affectedPersonnel', () => {
      const personnel = [{ name: 'John Doe', role: 'Operator' }];
      incident.affectedPersonnel = personnel;
      expect(incident.affectedPersonnel).toBe(personnel);
    });

    it('should get and set rootCauseAnalysis', () => {
      const analysis = { cause: 'Equipment failure' };
      incident.rootCauseAnalysis = analysis;
      expect(incident.rootCauseAnalysis).toBe(analysis);
    });

    it('should get and set contributingFactors', () => {
      const factors = [{ factor: 'Maintenance overdue' }];
      incident.contributingFactors = factors;
      expect(incident.contributingFactors).toBe(factors);
    });

    it('should get and set environmentalImpact', () => {
      const impact = { area: '50 sq meters' };
      incident.environmentalImpact = impact;
      expect(incident.environmentalImpact).toBe(impact);
    });

    it('should get and set propertyDamage', () => {
      const damage = 50000;
      incident.propertyDamage = damage;
      expect(incident.propertyDamage).toBe(damage);
    });

    it('should get and set estimatedCost', () => {
      const cost = 75000;
      incident.estimatedCost = cost;
      expect(incident.estimatedCost).toBe(cost);
    });

    it('should get and set reportableAgencies', () => {
      const agencies = ['EPA', 'OSHA'];
      incident.reportableAgencies = agencies;
      expect(incident.reportableAgencies).toBe(agencies);
    });

    it('should get and set regulatoryNotificationRequired', () => {
      incident.regulatoryNotificationRequired = true;
      expect(incident.regulatoryNotificationRequired).toBe(true);
    });

    it('should get and set notificationDeadline', () => {
      const deadline = new Date('2024-01-20');
      incident.notificationDeadline = deadline;
      expect(incident.notificationDeadline).toBe(deadline);
    });

    it('should get and set investigationStatus', () => {
      incident.investigationStatus = 'completed';
      expect(incident.investigationStatus).toBe('completed');
    });

    it('should get and set investigationLeadUserId', () => {
      incident.investigationLeadUserId = validUserId;
      expect(incident.investigationLeadUserId).toBe(validUserId);
    });

    it('should get and set investigationStartDate', () => {
      const date = new Date('2024-01-16');
      incident.investigationStartDate = date;
      expect(incident.investigationStartDate).toBe(date);
    });

    it('should get and set investigationCompletionDate', () => {
      const date = new Date('2024-01-20');
      incident.investigationCompletionDate = date;
      expect(incident.investigationCompletionDate).toBe(date);
    });

    it('should get and set status', () => {
      incident.status = 'remediation';
      expect(incident.status).toBe('remediation');
    });

    it('should get and set closureDate', () => {
      const date = new Date('2024-01-25');
      incident.closureDate = date;
      expect(incident.closureDate).toBe(date);
    });

    it('should get and set lessonsLearned', () => {
      const lessons = 'Improve maintenance procedures';
      incident.lessonsLearned = lessons;
      expect(incident.lessonsLearned).toBe(lessons);
    });

    it('should get and set createdAt', () => {
      const date = new Date('2024-01-14');
      incident.createdAt = date;
      expect(incident.createdAt).toBe(date);
    });

    it('should get and set updatedAt', () => {
      const date = new Date('2024-01-16');
      incident.updatedAt = date;
      expect(incident.updatedAt).toBe(date);
    });
  });

  describe('Entity Interface', () => {
    it('should implement getId method', () => {
      const incidentType = IncidentType.EQUIPMENT_FAILURE;
      const incident = new HSEIncident(
        validId,
        validIncidentNumber,
        incidentType,
        IncidentSeverity.MEDIUM,
        validOrganizationId,
        validIncidentDate,
        validLocation,
        validDescription,
        validUserId,
      );

      const id = incident.getId();
      expect(id.getValue()).toBe(validId);
    });
  });
});
