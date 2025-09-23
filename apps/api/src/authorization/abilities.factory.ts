import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Well } from '../domain/entities/well.entity';
import { WellStatus } from '../domain/enums/well-status.enum';

// Define all subjects that can be used in permissions
type Subjects =
  | InferSubjects<typeof Well | 'Well' | 'User' | 'Operator'>
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
  | 'audit'; // Can view audit logs

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
  // Subject type detector - currently only supports 'Well' entities
  // This function intentionally returns the same type as we only have one subject type
  // eslint-disable-next-line sonarjs/function-return-type
  private detectSubjectType(_item: unknown): ExtractSubjectType<Subjects> {
    // For now, we only support Well entities in our authorization system
    // Future enhancement: Add support for other entity types (User, Production, etc.)
    // All entities are treated as 'Well' for now
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
      cannot('export', 'Well');
      cannot('audit', 'Well');

      // Can read User information (for their own profile)
      can('read', 'User');
    }

    // Regulator permissions - can view all wells in their jurisdiction
    if (user.roles.includes('REGULATOR')) {
      // Can read all wells in their allowed states
      can('read', 'Well');

      // Can view sensitive regulatory data
      can('viewSensitive', 'Well');

      // Can view audit logs for compliance
      can('audit', 'Well');

      // Cannot modify wells (regulatory independence)
      cannot('create', 'Well');
      cannot('update', 'Well');
      cannot('delete', 'Well');
      cannot('updateStatus', 'Well');
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
