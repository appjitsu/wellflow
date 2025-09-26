import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Well } from '../domain/entities/well.entity';
import { EnvironmentalIncident } from '../domain/entities/environmental-incident.entity';
import { WellStatus } from '../domain/enums/well-status.enum';
import { Permit } from '../domain/entities/permit.entity';
import { HSEIncident } from '../domain/entities/hse-incident.entity';
import { EnvironmentalMonitoring } from '../domain/entities/environmental-monitoring.entity';
import { RegulatoryReport } from '../domain/entities/regulatory-report.entity';

// Define all subjects that can be used in permissions
type Subjects =
  | InferSubjects<
      | typeof Well
      | typeof EnvironmentalIncident
      | typeof Permit
      | typeof HSEIncident
      | typeof EnvironmentalMonitoring
      | typeof RegulatoryReport
      | 'Well'
      | 'Incident'
      | 'Permit'
      | 'HSEIncident'
      | 'EnvironmentalMonitoring'
      | 'RegulatoryReport'
      | 'PermitRenewal'
      | 'IncidentResponse'
      | 'WasteManagement'
      | 'ComplianceSchedule'
      | 'User'
      | 'Operator'
      | 'Organization'
      | 'Lease'
      | 'Production'
      | 'Partner'
      | 'Afe'
      | 'ComplianceReport'
      | 'DrillingProgram'
      | 'Workover'
      | 'DailyDrillingReport'
      | 'AuditLog'
      | 'MaintenanceSchedule'
      | 'OwnerPayment'
      | 'CashCall'
      | 'JointOperatingAgreement'
      | 'JibStatement'
    >
  | 'all';

// Define all actions that can be performed
export type Actions =
  | 'manage' // Can do anything
  | 'create' // Can create new resources
  | 'read' // Can view resources
  | 'update' // Can modify resources
  | 'delete' // Can remove resources
  | 'updateStatus' // Can change status
  | 'submitReport' // Can submit regulatory reports
  | 'viewSensitive' // Can view sensitive data
  | 'export' // Can export data
  | 'audit' // Can view audit logs
  | 'submit' // Can submit for approval
  | 'approve' // Can approve items
  | 'reject' // Can reject items
  // Regulatory-specific actions
  | 'applyPermit' // Can apply for permits
  | 'renewPermit' // Can renew permits
  | 'revokePermit' // Can revoke permits
  | 'suspendPermit' // Can suspend permits
  | 'reportIncident' // Can report HSE incidents
  | 'investigateIncident' // Can investigate incidents
  | 'respondIncident' // Can respond to incidents
  | 'closeIncident' // Can close incidents
  | 'recordMonitoring' // Can record environmental monitoring data
  | 'generateReport' // Can generate regulatory reports
  | 'validateReport' // Can validate reports
  | 'submitRegulatoryReport' // Can submit regulatory reports
  | 'reviewReport' // Can review reports
  | 'scheduleCompliance' // Can schedule compliance activities
  | 'overrideCompliance' // Can override compliance requirements
  | 'waiveFee' // Can waive filing fees
  | 'escalateIssue'; // Can escalate compliance issues

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export interface User {
  id: string;
  email: string;
  roles: string[];
  operatorId?: string;
  allowedStates?: string[];
  permissions?: string[];
}

/**
 * CASL Abilities Factory
 * Defines fine-grained permissions for oil & gas operations
 */
@Injectable()
export class AbilitiesFactory {
  // Subject type detector for CASL
  // eslint-disable-next-line sonarjs/function-return-type
  private detectSubjectType(item: unknown): ExtractSubjectType<Subjects> {
    if (item instanceof RegulatoryReport) return 'RegulatoryReport' as const;
    if (item instanceof EnvironmentalMonitoring)
      return 'EnvironmentalMonitoring' as const;
    if (item instanceof HSEIncident) return 'HSEIncident' as const;
    if (item instanceof Permit) return 'Permit' as const;
    if (item instanceof EnvironmentalIncident) return 'Incident' as const;
    if (item instanceof Well) return 'Well' as const;
    // Default to string subjects provided in decorators; fall back to 'Well' for unknowns
    return 'Well' as const;
  }
  createForUser(user: User): AppAbility {
    const { can, cannot, rules } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Admin permissions - can do everything
    if (user.roles.indexOf('ADMIN') !== -1) {
      can('manage', 'all');
      return createMongoAbility(rules, {
        detectSubjectType: (item: unknown) => this.detectSubjectType(item),
      });
    }

    // Operator permissions - can manage their own wells
    if (user.roles.indexOf('OPERATOR') !== -1) {
      // Can create wells for their operator
      can('create', 'Well');

      // Can read their own wells
      can('read', 'Well');

      // Can update their own wells (with restrictions)
      can('update', 'Well');

      // Can update status of their wells (with business rules)
      can('updateStatus', 'Well');

      // Can submit reports for producing wells they operate
      can('submitReport', 'Well');

      // Can export their own well data
      can('export', 'Well');

      // Cannot delete wells (regulatory requirement)
      cannot('delete', 'Well');

      // Cannot view audit logs
      cannot('audit', 'Well');

      // Can read User information (for their own profile)
      can('read', 'User');

      // AFE permissions for operators
      can('create', 'Afe');
      can('read', 'Afe');
      can('update', 'Afe');
      can('submit', 'Afe');
      can('export', 'Afe');

      // Incident permissions for operators
      can('create', 'Incident');
      can('read', 'Incident');
      can('update', 'Incident');
      can('updateStatus', 'Incident');
      can('export', 'Incident');
      cannot('delete', 'Incident');
      cannot('audit', 'Incident');

      // Operational entity permissions
      can('create', 'DrillingProgram');
      can('read', 'DrillingProgram');
      can('update', 'DrillingProgram');
      can('export', 'DrillingProgram');
      cannot('delete', 'DrillingProgram');

      // Financial entity permissions
      can('create', 'OwnerPayment');
      can('read', 'OwnerPayment');
      can('update', 'OwnerPayment');
      cannot('delete', 'OwnerPayment');

      can('create', 'CashCall');
      can('read', 'CashCall');
      can('update', 'CashCall');
      cannot('delete', 'CashCall');

      can('create', 'JointOperatingAgreement');
      can('read', 'JointOperatingAgreement');
      can('update', 'JointOperatingAgreement');

      can('create', 'JibStatement');
      can('read', 'JibStatement');
      can('update', 'JibStatement');
      cannot('delete', 'JointOperatingAgreement');

      can('create', 'Workover');
      can('read', 'Workover');
      can('update', 'Workover');
      can('export', 'Workover');
      cannot('delete', 'Workover');

      can('create', 'DailyDrillingReport');
      can('read', 'DailyDrillingReport');
      can('update', 'DailyDrillingReport');
      can('export', 'DailyDrillingReport');
      cannot('delete', 'DailyDrillingReport');

      can('create', 'MaintenanceSchedule');
      can('read', 'MaintenanceSchedule');
      can('update', 'MaintenanceSchedule');
      can('export', 'MaintenanceSchedule');
      cannot('delete', 'MaintenanceSchedule');

      // Cannot approve/reject AFEs (requires higher authority)
      cannot('approve', 'Afe');
      cannot('reject', 'Afe');
      cannot('delete', 'Afe');
      cannot('audit', 'Afe');

      // Regulatory compliance permissions for operators
      // Permits - operators can apply for and manage their permits
      can('create', 'Permit');
      can('read', 'Permit');
      can('update', 'Permit');
      can('applyPermit', 'Permit');
      can('renewPermit', 'Permit');
      can('submit', 'Permit');
      can('export', 'Permit');
      cannot('approve', 'Permit');
      cannot('reject', 'Permit');
      cannot('revokePermit', 'Permit');
      cannot('suspendPermit', 'Permit');
      cannot('audit', 'Permit');

      // HSE Incidents - operators can report and manage incidents
      can('create', 'HSEIncident');
      can('read', 'HSEIncident');
      can('update', 'HSEIncident');
      can('reportIncident', 'HSEIncident');
      can('updateStatus', 'HSEIncident');
      can('respondIncident', 'HSEIncident');
      can('export', 'HSEIncident');
      cannot('investigateIncident', 'HSEIncident');
      cannot('closeIncident', 'HSEIncident');
      cannot('audit', 'HSEIncident');

      // Environmental Monitoring - operators can record monitoring data
      can('create', 'EnvironmentalMonitoring');
      can('read', 'EnvironmentalMonitoring');
      can('recordMonitoring', 'EnvironmentalMonitoring');
      can('update', 'EnvironmentalMonitoring');
      can('export', 'EnvironmentalMonitoring');
      cannot('audit', 'EnvironmentalMonitoring');

      // Regulatory Reports - operators can generate and submit reports
      can('create', 'RegulatoryReport');
      can('read', 'RegulatoryReport');
      can('generateReport', 'RegulatoryReport');
      can('submitRegulatoryReport', 'RegulatoryReport');
      can('export', 'RegulatoryReport');
      cannot('reviewReport', 'RegulatoryReport');
      cannot('validateReport', 'RegulatoryReport');
      cannot('approve', 'RegulatoryReport');
      cannot('reject', 'RegulatoryReport');
      cannot('audit', 'RegulatoryReport');

      // Permit Renewals - operators can manage renewals
      can('create', 'PermitRenewal');
      can('read', 'PermitRenewal');
      can('renewPermit', 'PermitRenewal');
      can('submit', 'PermitRenewal');
      can('export', 'PermitRenewal');
      cannot('approve', 'PermitRenewal');
      cannot('audit', 'PermitRenewal');

      // Incident Responses - operators can respond to incidents
      can('create', 'IncidentResponse');
      can('read', 'IncidentResponse');
      can('update', 'IncidentResponse');
      can('respondIncident', 'IncidentResponse');
      can('export', 'IncidentResponse');
      cannot('audit', 'IncidentResponse');

      // Waste Management - operators can manage waste
      can('create', 'WasteManagement');
      can('read', 'WasteManagement');
      can('update', 'WasteManagement');
      can('recordMonitoring', 'WasteManagement');
      can('export', 'WasteManagement');
      cannot('audit', 'WasteManagement');

      // Compliance Schedules - operators can view schedules
      can('read', 'ComplianceSchedule');
      cannot('create', 'ComplianceSchedule');
      cannot('update', 'ComplianceSchedule');
      cannot('scheduleCompliance', 'ComplianceSchedule');
    }

    // Viewer permissions - read-only access
    if (user.roles.indexOf('VIEWER') !== -1) {
      // Can read wells they have access to
      can('read', 'Well');

      // Cannot modify anything
      cannot('create', 'Well');
      cannot('update', 'Well');
      cannot('delete', 'Well');
      cannot('updateStatus', 'Well');
      cannot('submitReport', 'Well');

      // Incident permissions for viewers - read-only
      can('read', 'Incident');

      // Operational entities - read-only
      can('read', 'DrillingProgram');
      can('read', 'Workover');
      can('read', 'DailyDrillingReport');
      can('read', 'MaintenanceSchedule');

      cannot('export', 'Well');
      cannot('audit', 'Well');

      // Can read User information (for their own profile)
      can('read', 'User');

      // Incident restrictions for viewers
      cannot('create', 'Incident');
      cannot('update', 'Incident');
      cannot('updateStatus', 'Incident');
      cannot('delete', 'Incident');
      cannot('export', 'Incident');
      cannot('audit', 'Incident');

      // AFE permissions for viewers - read-only
      can('read', 'Afe');

      // Cannot modify AFEs
      cannot('create', 'Afe');
      cannot('update', 'Afe');
      cannot('delete', 'Afe');
      cannot('submit', 'Afe');
      cannot('approve', 'Afe');
      cannot('reject', 'Afe');
      cannot('export', 'Afe');
      cannot('audit', 'Afe');

      // Regulatory compliance permissions for viewers - read-only
      can('read', 'Permit');
      can('read', 'HSEIncident');
      can('read', 'EnvironmentalMonitoring');
      can('read', 'RegulatoryReport');
      can('read', 'PermitRenewal');
      can('read', 'IncidentResponse');
      can('read', 'WasteManagement');
      can('read', 'ComplianceSchedule');

      // Cannot modify any regulatory entities
      cannot('create', 'Permit');
      cannot('update', 'Permit');
      cannot('delete', 'Permit');
      cannot('applyPermit', 'Permit');
      cannot('renewPermit', 'Permit');
      cannot('approve', 'Permit');
      cannot('reject', 'Permit');
      cannot('revokePermit', 'Permit');
      cannot('suspendPermit', 'Permit');
      cannot('submit', 'Permit');
      cannot('export', 'Permit');
      cannot('audit', 'Permit');

      cannot('create', 'HSEIncident');
      cannot('update', 'HSEIncident');
      cannot('delete', 'HSEIncident');
      cannot('reportIncident', 'HSEIncident');
      cannot('investigateIncident', 'HSEIncident');
      cannot('respondIncident', 'HSEIncident');
      cannot('closeIncident', 'HSEIncident');
      cannot('updateStatus', 'HSEIncident');
      cannot('export', 'HSEIncident');
      cannot('audit', 'HSEIncident');

      cannot('create', 'EnvironmentalMonitoring');
      cannot('update', 'EnvironmentalMonitoring');
      cannot('delete', 'EnvironmentalMonitoring');
      cannot('recordMonitoring', 'EnvironmentalMonitoring');
      cannot('export', 'EnvironmentalMonitoring');
      cannot('audit', 'EnvironmentalMonitoring');

      cannot('create', 'RegulatoryReport');
      cannot('update', 'RegulatoryReport');
      cannot('delete', 'RegulatoryReport');
      cannot('generateReport', 'RegulatoryReport');
      cannot('validateReport', 'RegulatoryReport');
      cannot('submitRegulatoryReport', 'RegulatoryReport');
      cannot('reviewReport', 'RegulatoryReport');
      cannot('approve', 'RegulatoryReport');
      cannot('reject', 'RegulatoryReport');
      cannot('export', 'RegulatoryReport');
      cannot('audit', 'RegulatoryReport');

      cannot('create', 'PermitRenewal');
      cannot('update', 'PermitRenewal');
      cannot('delete', 'PermitRenewal');
      cannot('renewPermit', 'PermitRenewal');
      cannot('submit', 'PermitRenewal');
      cannot('approve', 'PermitRenewal');
      cannot('export', 'PermitRenewal');
      cannot('audit', 'PermitRenewal');

      cannot('create', 'IncidentResponse');
      cannot('update', 'IncidentResponse');
      cannot('delete', 'IncidentResponse');
      cannot('respondIncident', 'IncidentResponse');
      cannot('export', 'IncidentResponse');
      cannot('audit', 'IncidentResponse');

      cannot('create', 'WasteManagement');
      cannot('update', 'WasteManagement');
      cannot('delete', 'WasteManagement');
      cannot('recordMonitoring', 'WasteManagement');
      cannot('export', 'WasteManagement');
      cannot('audit', 'WasteManagement');

      cannot('create', 'ComplianceSchedule');
      cannot('update', 'ComplianceSchedule');
      cannot('delete', 'ComplianceSchedule');
      cannot('scheduleCompliance', 'ComplianceSchedule');
    }

    // Manager permissions - can approve AFEs and manage operations
    if (user.roles.indexOf('MANAGER') !== -1) {
      // Can read and update wells
      can('read', 'Well');
      can('update', 'Well');
      can('updateStatus', 'Well');

      // Can submit reports
      can('submitReport', 'Well');

      // Can export data
      can('export', 'Well');

      // Cannot create or delete wells (requires operator role)
      cannot('create', 'Well');
      cannot('delete', 'Well');

      // Can read User information
      can('read', 'User');

      // AFE permissions for managers - can approve/reject
      can('read', 'Afe');
      can('update', 'Afe');
      can('submit', 'Afe');
      can('approve', 'Afe');
      can('reject', 'Afe');
      can('export', 'Afe');
      can('audit', 'Afe');

      // Operational entities for managers
      can('read', 'DrillingProgram');
      can('update', 'DrillingProgram');
      can('export', 'DrillingProgram');
      can('read', 'Workover');
      can('update', 'Workover');
      can('export', 'Workover');
      can('read', 'DailyDrillingReport');
      can('update', 'DailyDrillingReport');
      can('export', 'DailyDrillingReport');
      can('read', 'MaintenanceSchedule');
      can('update', 'MaintenanceSchedule');
      can('export', 'MaintenanceSchedule');

      // Incident permissions for managers
      can('read', 'Incident');
      can('update', 'Incident');
      can('updateStatus', 'Incident');
      can('export', 'Incident');
      cannot('create', 'Incident');
      cannot('delete', 'Incident');

      // Cannot create or delete AFEs (requires operator role)
      cannot('create', 'Afe');
      cannot('delete', 'Afe');

      // Regulatory compliance permissions for managers - approval authority
      // Permits - managers can approve/reject permits and manage compliance
      can('create', 'Permit');
      can('read', 'Permit');
      can('update', 'Permit');
      can('applyPermit', 'Permit');
      can('renewPermit', 'Permit');
      can('submit', 'Permit');
      can('approve', 'Permit');
      can('reject', 'Permit');
      can('revokePermit', 'Permit');
      can('suspendPermit', 'Permit');
      can('export', 'Permit');
      can('audit', 'Permit');
      can('overrideCompliance', 'Permit');

      // HSE Incidents - managers can investigate and close incidents
      can('create', 'HSEIncident');
      can('read', 'HSEIncident');
      can('update', 'HSEIncident');
      can('reportIncident', 'HSEIncident');
      can('investigateIncident', 'HSEIncident');
      can('updateStatus', 'HSEIncident');
      can('respondIncident', 'HSEIncident');
      can('closeIncident', 'HSEIncident');
      can('export', 'HSEIncident');
      can('audit', 'HSEIncident');
      can('escalateIssue', 'HSEIncident');

      // Environmental Monitoring - managers can oversee monitoring
      can('create', 'EnvironmentalMonitoring');
      can('read', 'EnvironmentalMonitoring');
      can('recordMonitoring', 'EnvironmentalMonitoring');
      can('update', 'EnvironmentalMonitoring');
      can('export', 'EnvironmentalMonitoring');
      can('audit', 'EnvironmentalMonitoring');
      can('overrideCompliance', 'EnvironmentalMonitoring');

      // Regulatory Reports - managers can review and approve reports
      can('create', 'RegulatoryReport');
      can('read', 'RegulatoryReport');
      can('generateReport', 'RegulatoryReport');
      can('validateReport', 'RegulatoryReport');
      can('submitRegulatoryReport', 'RegulatoryReport');
      can('reviewReport', 'RegulatoryReport');
      can('approve', 'RegulatoryReport');
      can('reject', 'RegulatoryReport');
      can('export', 'RegulatoryReport');
      can('audit', 'RegulatoryReport');

      // Permit Renewals - managers can approve renewals
      can('create', 'PermitRenewal');
      can('read', 'PermitRenewal');
      can('renewPermit', 'PermitRenewal');
      can('submit', 'PermitRenewal');
      can('approve', 'PermitRenewal');
      can('export', 'PermitRenewal');
      can('audit', 'PermitRenewal');

      // Incident Responses - managers can oversee responses
      can('create', 'IncidentResponse');
      can('read', 'IncidentResponse');
      can('update', 'IncidentResponse');
      can('respondIncident', 'IncidentResponse');
      can('export', 'IncidentResponse');
      can('audit', 'IncidentResponse');

      // Waste Management - managers can oversee waste operations
      can('create', 'WasteManagement');
      can('read', 'WasteManagement');
      can('update', 'WasteManagement');
      can('recordMonitoring', 'WasteManagement');
      can('export', 'WasteManagement');
      can('audit', 'WasteManagement');

      // Compliance Schedules - managers can manage schedules
      can('create', 'ComplianceSchedule');
      can('read', 'ComplianceSchedule');
      can('update', 'ComplianceSchedule');
      can('scheduleCompliance', 'ComplianceSchedule');
      can('export', 'ComplianceSchedule');
      cannot('audit', 'ComplianceSchedule');
    }

    // Regulator permissions - can view all wells in their jurisdiction
    if (user.roles.indexOf('REGULATOR') !== -1) {
      // Can read all wells in their allowed states
      can('read', 'Well');

      // Can view sensitive regulatory data
      can('viewSensitive', 'Well');

      // Can view audit logs for compliance

      // Incident permissions for regulators - read/audit only
      can('read', 'Incident');
      can('viewSensitive', 'Incident');
      can('audit', 'Incident');
      cannot('create', 'Incident');
      cannot('update', 'Incident');
      cannot('updateStatus', 'Incident');
      cannot('delete', 'Incident');

      can('audit', 'Well');

      // Cannot modify wells (regulatory independence)
      cannot('create', 'Well');
      cannot('update', 'Well');
      cannot('delete', 'Well');
      cannot('updateStatus', 'Well');

      // AFE permissions for regulators - read-only for compliance
      can('read', 'Afe');
      can('audit', 'Afe');

      // Operational entities for regulators - read/audit only
      can('read', 'DrillingProgram');
      can('audit', 'DrillingProgram');
      can('read', 'Workover');
      can('audit', 'Workover');
      can('read', 'DailyDrillingReport');
      can('audit', 'DailyDrillingReport');
      can('read', 'MaintenanceSchedule');
      can('audit', 'MaintenanceSchedule');

      // Cannot modify AFEs
      cannot('create', 'Afe');
      cannot('update', 'Afe');
      cannot('delete', 'Afe');
      cannot('submit', 'Afe');
      cannot('approve', 'Afe');
      cannot('reject', 'Afe');
      cannot('export', 'Afe');

      // Regulatory compliance permissions for regulators - compliance monitoring
      // Permits - regulators can view and audit permits in their jurisdiction
      can('read', 'Permit');
      can('viewSensitive', 'Permit');
      can('audit', 'Permit');
      can('export', 'Permit');
      cannot('create', 'Permit');
      cannot('update', 'Permit');
      cannot('delete', 'Permit');
      cannot('applyPermit', 'Permit');
      cannot('renewPermit', 'Permit');
      cannot('submit', 'Permit');
      cannot('approve', 'Permit');
      cannot('reject', 'Permit');
      cannot('revokePermit', 'Permit');
      cannot('suspendPermit', 'Permit');

      // HSE Incidents - regulators can view and audit incidents
      can('read', 'HSEIncident');
      can('viewSensitive', 'HSEIncident');
      can('audit', 'HSEIncident');
      can('export', 'HSEIncident');
      cannot('create', 'HSEIncident');
      cannot('update', 'HSEIncident');
      cannot('delete', 'HSEIncident');
      cannot('reportIncident', 'HSEIncident');
      cannot('investigateIncident', 'HSEIncident');
      cannot('respondIncident', 'HSEIncident');
      cannot('closeIncident', 'HSEIncident');
      cannot('updateStatus', 'HSEIncident');

      // Environmental Monitoring - regulators can view monitoring data
      can('read', 'EnvironmentalMonitoring');
      can('viewSensitive', 'EnvironmentalMonitoring');
      can('audit', 'EnvironmentalMonitoring');
      can('export', 'EnvironmentalMonitoring');
      cannot('create', 'EnvironmentalMonitoring');
      cannot('update', 'EnvironmentalMonitoring');
      cannot('delete', 'EnvironmentalMonitoring');
      cannot('recordMonitoring', 'EnvironmentalMonitoring');

      // Regulatory Reports - regulators can view submitted reports
      can('read', 'RegulatoryReport');
      can('viewSensitive', 'RegulatoryReport');
      can('audit', 'RegulatoryReport');
      can('export', 'RegulatoryReport');
      cannot('create', 'RegulatoryReport');
      cannot('update', 'RegulatoryReport');
      cannot('delete', 'RegulatoryReport');
      cannot('generateReport', 'RegulatoryReport');
      cannot('validateReport', 'RegulatoryReport');
      cannot('submitRegulatoryReport', 'RegulatoryReport');
      cannot('reviewReport', 'RegulatoryReport');
      cannot('approve', 'RegulatoryReport');
      cannot('reject', 'RegulatoryReport');

      // Permit Renewals - regulators can view renewal requests
      can('read', 'PermitRenewal');
      can('audit', 'PermitRenewal');
      can('export', 'PermitRenewal');
      cannot('create', 'PermitRenewal');
      cannot('update', 'PermitRenewal');
      cannot('delete', 'PermitRenewal');
      cannot('renewPermit', 'PermitRenewal');
      cannot('submit', 'PermitRenewal');
      cannot('approve', 'PermitRenewal');

      // Incident Responses - regulators can view responses
      can('read', 'IncidentResponse');
      can('audit', 'IncidentResponse');
      can('export', 'IncidentResponse');
      cannot('create', 'IncidentResponse');
      cannot('update', 'IncidentResponse');
      cannot('delete', 'IncidentResponse');
      cannot('respondIncident', 'IncidentResponse');

      // Waste Management - regulators can view waste operations
      can('read', 'WasteManagement');
      can('audit', 'WasteManagement');
      can('export', 'WasteManagement');
      cannot('create', 'WasteManagement');
      cannot('update', 'WasteManagement');
      cannot('delete', 'WasteManagement');
      cannot('recordMonitoring', 'WasteManagement');

      // Compliance Schedules - regulators can view schedules
      can('read', 'ComplianceSchedule');
      can('audit', 'ComplianceSchedule');
      can('export', 'ComplianceSchedule');
      cannot('create', 'ComplianceSchedule');
      cannot('update', 'ComplianceSchedule');
      cannot('scheduleCompliance', 'ComplianceSchedule');
    }

    // Auditor permissions - read-only access to audit trails
    if (user.roles.indexOf('AUDITOR') !== -1) {
      can('audit', 'Well');
      can('read', 'Well');

      // Audit log permissions - auditors need full access to logs
      can('manage', 'AuditLog');

      // Cannot modify anything
      cannot('create', 'Well');
      cannot('update', 'Well');
      cannot('delete', 'Well');
      cannot('updateStatus', 'Well');
      cannot('submitReport', 'Well');

      // Incident permissions for auditors - read/audit only
      can('read', 'Incident');
      can('audit', 'Incident');
      cannot('create', 'Incident');
      cannot('update', 'Incident');
      cannot('updateStatus', 'Incident');
      cannot('delete', 'Incident');

      // AFE permissions for auditors - read and audit only
      can('read', 'Afe');
      can('audit', 'Afe');

      // Cannot modify AFEs
      cannot('create', 'Afe');
      cannot('update', 'Afe');
      cannot('delete', 'Afe');
      cannot('submit', 'Afe');
      cannot('approve', 'Afe');
      cannot('reject', 'Afe');
      cannot('export', 'Afe');

      // Regulatory compliance permissions for auditors - full audit access
      // Permits - auditors can view and audit all permits
      can('read', 'Permit');
      can('audit', 'Permit');
      can('viewSensitive', 'Permit');
      can('export', 'Permit');
      cannot('create', 'Permit');
      cannot('update', 'Permit');
      cannot('delete', 'Permit');
      cannot('applyPermit', 'Permit');
      cannot('renewPermit', 'Permit');
      cannot('submit', 'Permit');
      cannot('approve', 'Permit');
      cannot('reject', 'Permit');
      cannot('revokePermit', 'Permit');
      cannot('suspendPermit', 'Permit');

      // HSE Incidents - auditors can view and audit all incidents
      can('read', 'HSEIncident');
      can('audit', 'HSEIncident');
      can('viewSensitive', 'HSEIncident');
      can('export', 'HSEIncident');
      cannot('create', 'HSEIncident');
      cannot('update', 'HSEIncident');
      cannot('delete', 'HSEIncident');
      cannot('reportIncident', 'HSEIncident');
      cannot('investigateIncident', 'HSEIncident');
      cannot('respondIncident', 'HSEIncident');
      cannot('closeIncident', 'HSEIncident');
      cannot('updateStatus', 'HSEIncident');

      // Environmental Monitoring - auditors can view and audit monitoring data
      can('read', 'EnvironmentalMonitoring');
      can('audit', 'EnvironmentalMonitoring');
      can('viewSensitive', 'EnvironmentalMonitoring');
      can('export', 'EnvironmentalMonitoring');
      cannot('create', 'EnvironmentalMonitoring');
      cannot('update', 'EnvironmentalMonitoring');
      cannot('delete', 'EnvironmentalMonitoring');
      cannot('recordMonitoring', 'EnvironmentalMonitoring');

      // Regulatory Reports - auditors can view and audit all reports
      can('read', 'RegulatoryReport');
      can('audit', 'RegulatoryReport');
      can('viewSensitive', 'RegulatoryReport');
      can('export', 'RegulatoryReport');
      cannot('create', 'RegulatoryReport');
      cannot('update', 'RegulatoryReport');
      cannot('delete', 'RegulatoryReport');
      cannot('generateReport', 'RegulatoryReport');
      cannot('validateReport', 'RegulatoryReport');
      cannot('submitRegulatoryReport', 'RegulatoryReport');
      cannot('reviewReport', 'RegulatoryReport');
      cannot('approve', 'RegulatoryReport');
      cannot('reject', 'RegulatoryReport');

      // Permit Renewals - auditors can view and audit renewals
      can('read', 'PermitRenewal');
      can('audit', 'PermitRenewal');
      can('viewSensitive', 'PermitRenewal');
      can('export', 'PermitRenewal');
      cannot('create', 'PermitRenewal');
      cannot('update', 'PermitRenewal');
      cannot('delete', 'PermitRenewal');
      cannot('renewPermit', 'PermitRenewal');
      cannot('submit', 'PermitRenewal');
      cannot('approve', 'PermitRenewal');

      // Incident Responses - auditors can view and audit responses
      can('read', 'IncidentResponse');
      can('audit', 'IncidentResponse');
      can('viewSensitive', 'IncidentResponse');
      can('export', 'IncidentResponse');
      cannot('create', 'IncidentResponse');
      cannot('update', 'IncidentResponse');
      cannot('delete', 'IncidentResponse');
      cannot('respondIncident', 'IncidentResponse');

      // Waste Management - auditors can view and audit waste operations
      can('read', 'WasteManagement');
      can('audit', 'WasteManagement');
      can('viewSensitive', 'WasteManagement');
      can('export', 'WasteManagement');
      cannot('create', 'WasteManagement');
      cannot('update', 'WasteManagement');
      cannot('delete', 'WasteManagement');
      cannot('recordMonitoring', 'WasteManagement');

      // Compliance Schedules - auditors can view and audit schedules
      can('read', 'ComplianceSchedule');
      can('audit', 'ComplianceSchedule');
      can('viewSensitive', 'ComplianceSchedule');
      can('export', 'ComplianceSchedule');
      cannot('create', 'ComplianceSchedule');
      cannot('update', 'ComplianceSchedule');
      cannot('scheduleCompliance', 'ComplianceSchedule');
    }

    return createMongoAbility(rules, {
      detectSubjectType: (item: unknown) => this.detectSubjectType(item),
    });
  }

  /**
   * Create abilities for specific well operations
   * Used for complex business rule validation
   */
  createForWellOperation(user: User, well: Well, operation: string) {
    const ability = this.createForUser(user);

    // Additional business rules based on well status
    switch (operation) {
      case 'drilling':
        // Can only start drilling if well is planned or permitted
        return (
          ability.can('updateStatus', well) &&
          [WellStatus.PLANNED, WellStatus.PERMITTED].indexOf(
            well.getStatus(),
          ) !== -1
        );

      case 'completion':
        // Can only complete if currently drilling
        return (
          ability.can('updateStatus', well) &&
          well.getStatus() === WellStatus.DRILLING
        );

      case 'production':
        // Can only start production if completed
        return (
          ability.can('updateStatus', well) &&
          well.getStatus() === WellStatus.COMPLETED
        );

      case 'abandonment':
        // Can abandon from most statuses except plugged
        return (
          ability.can('updateStatus', well) &&
          well.getStatus() !== WellStatus.PLUGGED
        );

      default:
        return ability.can('update', well);
    }
  }

  /**
   * Create abilities for guest users (no authentication)
   */
  createForGuest(): AppAbility {
    const { can, cannot, rules } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // Guests can only read public wells
    can('read', 'Well', { isPublic: true });

    // Cannot perform any other actions
    cannot('create', 'all');
    cannot('update', 'all');
    cannot('delete', 'all');
    cannot('manage', 'all');

    return createMongoAbility(rules, {
      detectSubjectType: (item: unknown) => this.detectSubjectType(item),
    });
  }
}
