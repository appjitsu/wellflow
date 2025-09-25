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

// Define all subjects that can be used in permissions
type Subjects =
  | InferSubjects<
      | typeof Well
      | typeof EnvironmentalIncident
      | 'Well'
      | 'Incident'
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
      | 'MaintenanceSchedule'
    >
  | 'all';

// Define all actions that can be performed
export type Actions =
  | 'manage' // Can do anything
  | 'create' // Can create new resources
  | 'read' // Can view resources
  | 'update' // Can modify resources
  | 'delete' // Can remove resources
  | 'updateStatus' // Can change well status
  | 'submitReport' // Can submit regulatory reports
  | 'viewSensitive' // Can view sensitive data
  | 'export' // Can export data
  | 'audit' // Can view audit logs
  | 'submit' // Can submit AFEs for approval
  | 'approve' // Can approve AFEs
  | 'reject'; // Can reject AFEs

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
    if (user.roles.includes('ADMIN')) {
      can('manage', 'all');
      return createMongoAbility(rules, {
        detectSubjectType: (item: unknown) => this.detectSubjectType(item),
      });
    }

    // Operator permissions - can manage their own wells
    if (user.roles.includes('OPERATOR')) {
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
    }

    // Viewer permissions - read-only access
    if (user.roles.includes('VIEWER')) {
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
    }

    // Manager permissions - can approve AFEs and manage operations
    if (user.roles.includes('MANAGER')) {
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
    }

    // Regulator permissions - can view all wells in their jurisdiction
    if (user.roles.includes('REGULATOR')) {
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
    }

    // Auditor permissions - read-only access to audit trails
    if (user.roles.includes('AUDITOR')) {
      can('audit', 'Well');
      can('read', 'Well');

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
          [WellStatus.PLANNED, WellStatus.PERMITTED].includes(well.getStatus())
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
