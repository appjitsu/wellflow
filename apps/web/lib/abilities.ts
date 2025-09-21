import {
  AbilityBuilder,
  PureAbility,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
} from '@casl/ability';

// Define all subjects that can be used in permissions
type Subjects = InferSubjects<'Well' | 'Lease' | 'Production'> | 'all';

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

export type AppAbility = MongoAbility<[Actions, Subjects], MongoQuery>;

export interface User {
  id: string;
  email: string;
  roles: string[];
  operatorId?: string;
  allowedStates?: string[];
  permissions?: string[];
}

/**
 * CASL Abilities Factory for Frontend
 * Creates abilities based on user permissions from backend
 */
export function createAbilityForUser(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  // Admin permissions - can do everything
  if (user.roles.includes('ADMIN')) {
    can('manage', 'all');
    return build({
      detectSubjectType: (item) =>
        (item as Record<string, unknown>).constructor as unknown as ExtractSubjectType<Subjects>,
    }) as AppAbility;
  }

  // Operator permissions - can manage their own wells
  if (user.roles.includes('OPERATOR')) {
    // Can create wells for their operator
    can('create', 'Well');

    // Can read their own wells
    can('read', 'Well', { operatorId: user.operatorId });

    // Can update their own wells (with restrictions)
    can('update', 'Well', {
      operatorId: user.operatorId,
      status: { $ne: 'plugged' },
    });

    // Can update status of their wells (except plugged wells)
    can('updateStatus', 'Well', {
      operatorId: user.operatorId,
      status: { $ne: 'plugged' },
    });

    // Can submit reports for producing wells they operate
    can('submitReport', 'Well', { operatorId: user.operatorId, status: 'producing' });

    // Can export their own well data
    can('export', 'Well', { operatorId: user.operatorId });

    // Cannot delete wells (regulatory requirement)
    cannot('delete', 'Well');

    // Cannot view audit logs
    cannot('audit', 'Well');
  }

  // Viewer permissions - read-only access
  if (user.roles.includes('VIEWER')) {
    // Can read wells they have access to (their operator's wells)
    can('read', 'Well', { operatorId: user.operatorId });

    // Cannot modify anything
    cannot('create', 'Well');
    cannot('update', 'Well');
    cannot('delete', 'Well');
    cannot('updateStatus', 'Well');
    cannot('submitReport', 'Well');
    cannot('export', 'Well');
    cannot('audit', 'Well');
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

  return build({
    detectSubjectType: (item) =>
      (item as Record<string, unknown>).constructor as unknown as ExtractSubjectType<Subjects>,
    conditionsMatcher: (conditions) => (object) => {
      if (!conditions || !object) return true;
      return Object.keys(conditions).every((key) => {
        // eslint-disable-next-line security/detect-object-injection
        const condition = (conditions as Record<string, unknown>)[key];
        // eslint-disable-next-line security/detect-object-injection
        const value = (object as Record<string, unknown>)[key];

        // Handle MongoDB-style operators
        if (typeof condition === 'object' && condition !== null) {
          const conditionObj = condition as Record<string, unknown>;
          if (conditionObj.$ne !== undefined) {
            return value !== conditionObj.$ne;
          }
        }

        return value === condition;
      });
    },
  }) as AppAbility;
}

/**
 * Create abilities for guest users (no authentication)
 */
export function createAbilityForGuest(): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    PureAbility as AbilityClass<AppAbility>
  );

  // Guest users can only read public information
  can('read', 'Well');

  // Cannot perform any other actions
  cannot('create', 'all');
  cannot('update', 'all');
  cannot('delete', 'all');
  cannot('manage', 'all');

  return build({
    detectSubjectType: (item) =>
      (item as Record<string, unknown>).constructor as unknown as ExtractSubjectType<Subjects>,
    conditionsMatcher: (conditions) => (object) => {
      if (!conditions || !object) return true;
      return Object.keys(conditions).every((key) => {
        // eslint-disable-next-line security/detect-object-injection
        const condition = (conditions as Record<string, unknown>)[key];
        // eslint-disable-next-line security/detect-object-injection
        const value = (object as Record<string, unknown>)[key];

        // Handle MongoDB-style operators
        if (typeof condition === 'object' && condition !== null) {
          const conditionObj = condition as Record<string, unknown>;
          if (conditionObj.$ne !== undefined) {
            return value !== conditionObj.$ne;
          }
        }

        return value === condition;
      });
    },
  }) as AppAbility;
}
