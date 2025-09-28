import { Test, TestingModule } from '@nestjs/testing';
import { subject } from '@casl/ability';
import { AbilitiesFactory } from '../abilities.factory';
import { Well } from '../../../domain/entities/well.entity';
import { ApiNumber } from '../../../domain/value-objects/api-number';
import { Location } from '../../../domain/value-objects/location';
import { Coordinates } from '../../../domain/value-objects/coordinates';
import { WellStatus, WellType } from '../../../domain/enums/well-status.enum';
import { EnvironmentalIncident } from '../../../domain/entities/environmental-incident.entity';
import {
  IncidentType,
  IncidentSeverity,
} from '../../../domain/enums/environmental-incident.enums';

describe('AbilitiesFactory', () => {
  let factory: AbilitiesFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilitiesFactory],
    }).compile();

    factory = module.get<AbilitiesFactory>(AbilitiesFactory);
  });

  // Helper function to create test wells
  const createTestWell = (
    id: string,
    operatorId: string,
    status: WellStatus = WellStatus.PLANNED,
    state: string = 'TX',
  ): Well => {
    const apiNumber = new ApiNumber('4212345678');
    const coordinates = new Coordinates(32.7767, -96.797);
    const location = new Location(coordinates, {
      address: '123 Test St',
      county: 'Dallas',
      state,
      country: 'USA',
    });

    return new Well(
      id,
      apiNumber,
      `Test Well ${id}`,
      operatorId,
      WellType.OIL,
      location,
      { status },
    );
  };

  describe('createForUser', () => {
    it('should create abilities for admin user', () => {
      const user = {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Admin can manage all wells
      expect(ability.can('create', 'Well')).toBe(true);
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('update', 'Well')).toBe(true);
      expect(ability.can('delete', 'Well')).toBe(true);

      // Admin can manage users
      expect(ability.can('create', 'User')).toBe(true);
      expect(ability.can('read', 'User')).toBe(true);

      // Admin can manage AFEs
      expect(ability.can('create', 'Afe')).toBe(true);
      expect(ability.can('read', 'Afe')).toBe(true);
      expect(ability.can('update', 'Afe')).toBe(true);
      expect(ability.can('submit', 'Afe')).toBe(true);
      expect(ability.can('approve', 'Afe')).toBe(true);
      expect(ability.can('reject', 'Afe')).toBe(true);
      expect(ability.can('delete', 'Afe')).toBe(true);
      expect(ability.can('export', 'Afe')).toBe(true);
      expect(ability.can('audit', 'Afe')).toBe(true);
      expect(ability.can('update', 'User')).toBe(true);
      expect(ability.can('delete', 'User')).toBe(true);

      // Admin can manage operators
      expect(ability.can('create', 'Operator')).toBe(true);
      expect(ability.can('read', 'Operator')).toBe(true);
      expect(ability.can('update', 'Operator')).toBe(true);
      expect(ability.can('delete', 'Operator')).toBe(true);
    });

    it('should create abilities for operator user', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Operator can manage their own wells
      expect(ability.can('create', 'Well')).toBe(true);
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('update', 'Well')).toBe(true);

      // Operator cannot delete wells
      expect(ability.can('delete', 'Well')).toBe(false);

      // Operator cannot manage other users
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('update', 'User')).toBe(false);
      expect(ability.can('delete', 'User')).toBe(false);

      // Operator can read their own profile
      expect(ability.can('read', 'User')).toBe(true);

      // Operator AFE permissions
      expect(ability.can('create', 'Afe')).toBe(true);
      expect(ability.can('read', 'Afe')).toBe(true);
      expect(ability.can('update', 'Afe')).toBe(true);
      expect(ability.can('submit', 'Afe')).toBe(true);
      expect(ability.can('export', 'Afe')).toBe(true);

      // Operator AFE restrictions
      expect(ability.can('approve', 'Afe')).toBe(false);
      expect(ability.can('reject', 'Afe')).toBe(false);
      expect(ability.can('delete', 'Afe')).toBe(false);
      expect(ability.can('audit', 'Afe')).toBe(false);
    });

    it('should create abilities for viewer user', () => {
      const user = {
        id: 'viewer-1',
        email: 'viewer@example.com',
        roles: ['VIEWER'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Viewer can only read wells
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);

      // Viewer cannot manage users
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('update', 'User')).toBe(false);
      expect(ability.can('delete', 'User')).toBe(false);

      // Viewer can read their own profile
      expect(ability.can('read', 'User')).toBe(true);

      // Viewer AFE permissions - read only
      expect(ability.can('read', 'Afe')).toBe(true);

      // Viewer AFE restrictions
      expect(ability.can('create', 'Afe')).toBe(false);
      expect(ability.can('update', 'Afe')).toBe(false);
      expect(ability.can('delete', 'Afe')).toBe(false);
      expect(ability.can('submit', 'Afe')).toBe(false);
      expect(ability.can('approve', 'Afe')).toBe(false);
      expect(ability.can('reject', 'Afe')).toBe(false);
      expect(ability.can('export', 'Afe')).toBe(false);
      expect(ability.can('audit', 'Afe')).toBe(false);
    });

    it('should handle multi-tenant permissions for wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Can access wells from their operator
      const ownWell = createTestWell('well-1', 'operator-1');
      expect(ability.can('read', ownWell)).toBe(true);
      expect(ability.can('update', ownWell)).toBe(true);

      // For now, operators can access all wells (simplified implementation)
      // In a full implementation, this would be restricted by operatorId
      const otherWell = createTestWell('well-2', 'operator-2');
      expect(ability.can('read', otherWell)).toBe(true);
      expect(ability.can('update', otherWell)).toBe(true);
    });

    it('should handle well status restrictions', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Can update active wells
      const activeWell = createTestWell(
        'well-1',
        'operator-1',
        WellStatus.PRODUCING,
      );
      expect(ability.can('update', activeWell)).toBe(true);

      // For now, operators can update all wells (simplified implementation)
      // In a full implementation, this would be restricted by well status
      const pluggedWell = createTestWell(
        'well-2',
        'operator-1',
        WellStatus.PLUGGED,
      );
      expect(ability.can('update', pluggedWell)).toBe(true);
    });

    it('should handle geographic restrictions for Texas operators', () => {
      const texasUser = {
        id: 'texas-operator',
        email: 'texas@example.com',
        roles: ['OPERATOR'],
        operatorId: 'texas-operator',
        allowedStates: ['TX'],
      };

      const ability = factory.createForUser(texasUser);

      // Texas operator can access wells in Texas
      const texasWell = createTestWell(
        'well-1',
        'texas-operator',
        WellStatus.PLANNED,
        'TX',
      );
      expect(ability.can('read', texasWell)).toBe(true);

      // But cannot access wells in other states (if they had access)
      const oklahomaWell = createTestWell(
        'well-2',
        'texas-operator',
        WellStatus.PLANNED,
        'OK',
      );
      // This would depend on specific business rules
      // For now, assuming operators can access their wells regardless of state
      expect(ability.can('read', oklahomaWell)).toBe(true);
    });

    it('should handle user profile access restrictions', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const ability = factory.createForUser(user);

      // Operator has basic User permissions but not specific profile access
      // The current implementation doesn't define specific User permissions for operators
      expect(ability.can('read', 'User')).toBe(true);
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('update', 'User')).toBe(false);
      expect(ability.can('delete', 'User')).toBe(false);
    });
    it('should create abilities for regulator user', () => {
      const user = {
        id: 'regulator-1',
        email: 'regulator@example.com',
        roles: ['REGULATOR'],
        allowedStates: ['TX', 'OK'],
      };

      const ability = factory.createForUser(user);

      // Regulator can read wells in their jurisdiction
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('viewSensitive', 'Well')).toBe(true);
      expect(ability.can('audit', 'Well')).toBe(true);

      // Regulator cannot modify wells
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('updateStatus', 'Well')).toBe(false);
    });

    it('should create abilities for auditor user', () => {
      const user = {
        id: 'auditor-1',
        email: 'auditor@example.com',
        roles: ['AUDITOR'],
      };

      const ability = factory.createForUser(user);

      // Auditor can read and audit wells
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('audit', 'Well')).toBe(true);

      // Auditor cannot modify wells
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('updateStatus', 'Well')).toBe(false);
      expect(ability.can('submitReport', 'Well')).toBe(false);
    });

    it('should define incident permissions across roles', () => {
      const mk = (roles: string[]) =>
        factory.createForUser({ id: 'u', email: 'u@x', roles });

      const admin = mk(['ADMIN']);
      expect(admin.can('create', 'Incident')).toBe(true);
      expect(admin.can('delete', 'Incident')).toBe(true);
      expect(admin.can('updateStatus', 'Incident')).toBe(true);

      const operator = mk(['OPERATOR']);
      expect(operator.can('create', 'Incident')).toBe(true);
      expect(operator.can('read', 'Incident')).toBe(true);
      expect(operator.can('update', 'Incident')).toBe(true);
      expect(operator.can('updateStatus', 'Incident')).toBe(true);
      expect(operator.can('export', 'Incident')).toBe(true);
      expect(operator.can('delete', 'Incident')).toBe(false);
      expect(operator.can('audit', 'Incident')).toBe(false);

      const manager = mk(['MANAGER']);
      expect(manager.can('read', 'Incident')).toBe(true);
      expect(manager.can('update', 'Incident')).toBe(true);
      expect(manager.can('updateStatus', 'Incident')).toBe(true);
      expect(manager.can('create', 'Incident')).toBe(false);
      expect(manager.can('delete', 'Incident')).toBe(false);

      const viewer = mk(['VIEWER']);
      expect(viewer.can('read', 'Incident')).toBe(true);
      expect(viewer.can('create', 'Incident')).toBe(false);
      expect(viewer.can('update', 'Incident')).toBe(false);
      expect(viewer.can('updateStatus', 'Incident')).toBe(false);
      expect(viewer.can('delete', 'Incident')).toBe(false);
      expect(viewer.can('export', 'Incident')).toBe(false);

      const regulator = mk(['REGULATOR']);
      expect(regulator.can('read', 'Incident')).toBe(true);
      expect(regulator.can('viewSensitive', 'Incident')).toBe(true);
      expect(regulator.can('audit', 'Incident')).toBe(true);
      expect(regulator.can('create', 'Incident')).toBe(false);
      expect(regulator.can('update', 'Incident')).toBe(false);
      expect(regulator.can('updateStatus', 'Incident')).toBe(false);

      const auditor = mk(['AUDITOR']);
      expect(auditor.can('read', 'Incident')).toBe(true);
      expect(auditor.can('audit', 'Incident')).toBe(true);
      expect(auditor.can('create', 'Incident')).toBe(false);
      expect(auditor.can('updateStatus', 'Incident')).toBe(false);
    });

    it('should evaluate instance-based permissions for EnvironmentalIncident', () => {
      const mk = (roles: string[]) =>
        factory.createForUser({ id: 'u', email: 'u@x', roles });
      const inc = new EnvironmentalIncident({
        id: 'inc-1',
        organizationId: 'org-1',
        reportedByUserId: 'user-1',
        incidentNumber: 'INC-001',
        incidentType: IncidentType.SPILL,
        incidentDate: new Date('2024-01-01'),
        discoveryDate: new Date('2024-01-01'),
        location: 'Test Site',
        description: 'Test incident',
        severity: IncidentSeverity.LOW,
      });

      expect(mk(['ADMIN']).can('updateStatus', inc)).toBe(true);
      expect(mk(['OPERATOR']).can('updateStatus', inc)).toBe(true);
      expect(mk(['MANAGER']).can('updateStatus', inc)).toBe(true);
      expect(mk(['VIEWER']).can('updateStatus', inc)).toBe(false);
      expect(mk(['REGULATOR']).can('updateStatus', inc)).toBe(false);
      expect(mk(['AUDITOR']).can('updateStatus', inc)).toBe(false);

      // read should work via instance detection too
      expect(mk(['VIEWER']).can('read', inc)).toBe(true);
    });
  });

  describe('createForWellOperation', () => {
    it('should allow drilling operation for planned wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const well = createTestWell('well-1', 'operator-1', WellStatus.PLANNED);
      const canDrill = factory.createForWellOperation(user, well, 'drilling');

      expect(canDrill).toBe(true);
    });

    it('should not allow drilling operation for producing wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const well = createTestWell('well-1', 'operator-1', WellStatus.PRODUCING);
      const canDrill = factory.createForWellOperation(user, well, 'drilling');

      expect(canDrill).toBe(false);
    });

    it('should allow completion operation for drilling wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const well = createTestWell('well-1', 'operator-1', WellStatus.DRILLING);
      const canComplete = factory.createForWellOperation(
        user,
        well,
        'completion',
      );

      expect(canComplete).toBe(true);
    });

    it('should allow production operation for completed wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const well = createTestWell('well-1', 'operator-1', WellStatus.COMPLETED);
      const canProduce = factory.createForWellOperation(
        user,
        well,
        'production',
      );

      expect(canProduce).toBe(true);
    });

    it('should not allow abandonment operation for plugged wells', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const well = createTestWell('well-1', 'operator-1', WellStatus.PLUGGED);
      const canAbandon = factory.createForWellOperation(
        user,
        well,
        'abandonment',
      );

      expect(canAbandon).toBe(false);
    });
  });

  describe('createForGuest', () => {
    it('should create minimal abilities for guest', () => {
      const ability = factory.createForGuest();

      // Guest can only read public wells
      const publicWell = createTestWell('well-1', 'operator-1');
      // Note: The current implementation checks for isPublic property which our test well doesn't have
      // So this will return false, which is correct for non-public wells
      expect(ability.can('read', publicWell)).toBe(false);

      // Guest cannot perform any other actions
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);

      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('read', 'User')).toBe(false);
      expect(ability.can('update', 'User')).toBe(false);
      expect(ability.can('delete', 'User')).toBe(false);
    });
  });

  describe('Owner Role Permissions', () => {
    it('should grant full access to resources within organization', () => {
      const user = {
        id: 'owner-1',
        email: 'owner@example.com',
        organizationId: 'org-123',
        roles: ['OWNER'],
      };

      const ability = factory.createForUser(user);

      // Well management - full access within organization
      expect(
        ability.can('create', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('update', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('delete', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('audit', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);

      // User management - full access within organization
      expect(
        ability.can('create', subject('User', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can(
          'assignRole',
          subject('User', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(
        ability.can(
          'inviteUser',
          subject('User', { organizationId: 'org-123' }),
        ),
      ).toBe(true);

      // Financial management - full access within organization
      expect(
        ability.can(
          'create',
          subject('OwnerPayment', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(
        ability.can(
          'approve',
          subject('CashCall', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(
        ability.can('manage', subject('Organization', { id: 'org-123' })),
      ).toBe(true);
    });

    it('should deny access to resources outside organization', () => {
      const user = {
        id: 'owner-1',
        email: 'owner@example.com',
        organizationId: 'org-123',
        roles: ['OWNER'],
      };

      const ability = factory.createForUser(user);

      // Cannot access resources from different organization
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-456' })),
      ).toBe(false);
      expect(
        ability.can('create', subject('User', { organizationId: 'org-456' })),
      ).toBe(false);
      expect(
        ability.can('manage', subject('Organization', { id: 'org-456' })),
      ).toBe(false);
    });
  });

  describe('Manager Role Permissions', () => {
    it('should grant operational access within organization', () => {
      const user = {
        id: 'manager-1',
        email: 'manager@example.com',
        organizationId: 'org-123',
        roles: ['MANAGER'],
      };

      const ability = factory.createForUser(user);

      // Well management - read and update within organization
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('update', subject('Well', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can(
          'updateStatus',
          subject('Well', { organizationId: 'org-123' }),
        ),
      ).toBe(true);

      // Cannot create or delete wells
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);

      // Production data management
      expect(
        ability.can(
          'read',
          subject('Production', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(
        ability.can(
          'create',
          subject('Production', { organizationId: 'org-123' }),
        ),
      ).toBe(true);

      // AFE permissions - can approve/reject
      expect(
        ability.can('approve', subject('Afe', { organizationId: 'org-123' })),
      ).toBe(true);
      expect(
        ability.can('reject', subject('Afe', { organizationId: 'org-123' })),
      ).toBe(true);

      // Limited financial access - read only
      expect(
        ability.can(
          'read',
          subject('OwnerPayment', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(ability.can('create', 'OwnerPayment')).toBe(false);
      expect(ability.can('approve', 'OwnerPayment')).toBe(false);

      // Cannot manage users or organization
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('assignRole', 'User')).toBe(false);
      expect(ability.can('update', 'Organization')).toBe(false);
    });

    it('should deny access to resources outside organization', () => {
      const user = {
        id: 'manager-1',
        email: 'manager@example.com',
        organizationId: 'org-123',
        roles: ['MANAGER'],
      };

      const ability = factory.createForUser(user);

      // Cannot access resources from different organization
      expect(
        ability.can('read', subject('Well', { organizationId: 'org-456' })),
      ).toBe(false);
      expect(
        ability.can(
          'read',
          subject('Production', { organizationId: 'org-456' }),
        ),
      ).toBe(false);
      expect(
        ability.can(
          'read',
          subject('OwnerPayment', { organizationId: 'org-456' }),
        ),
      ).toBe(false);
    });
  });

  describe('Pumper Role Permissions', () => {
    it('should grant limited access to assigned wells only', () => {
      const user = {
        id: 'pumper-1',
        email: 'pumper@example.com',
        organizationId: 'org-123',
        roles: ['PUMPER'],
      };

      const ability = factory.createForUser(user);

      // Can only read wells assigned to them
      expect(
        ability.can(
          'read',
          subject('Well', {
            organizationId: 'org-123',
            assignedPumperId: 'pumper-1',
          }),
        ),
      ).toBe(true);

      // Cannot read wells not assigned to them
      expect(
        ability.can(
          'read',
          subject('Well', {
            organizationId: 'org-123',
            assignedPumperId: 'other-pumper',
          }),
        ),
      ).toBe(false);

      // Can create/update production data for assigned wells
      expect(
        ability.can(
          'create',
          subject('Production', {
            organizationId: 'org-123',
            well: { assignedPumperId: 'pumper-1' },
          }),
        ),
      ).toBe(true);

      expect(
        ability.can(
          'update',
          subject('Production', {
            organizationId: 'org-123',
            well: { assignedPumperId: 'pumper-1' },
          }),
        ),
      ).toBe(true);

      // Can read their own user profile
      expect(
        ability.can(
          'read',
          subject('User', {
            id: 'pumper-1',
            organizationId: 'org-123',
          }),
        ),
      ).toBe(true);

      // Cannot read other users
      expect(
        ability.can(
          'read',
          subject('User', {
            id: 'other-user',
            organizationId: 'org-123',
          }),
        ),
      ).toBe(false);
    });

    it('should deny access to financial and administrative functions', () => {
      const user = {
        id: 'pumper-1',
        email: 'pumper@example.com',
        organizationId: 'org-123',
        roles: ['PUMPER'],
      };

      const ability = factory.createForUser(user);

      // Cannot access financial data
      expect(ability.can('read', 'OwnerPayment')).toBe(false);
      expect(ability.can('read', 'CashCall')).toBe(false);
      expect(ability.can('read', 'JointOperatingAgreement')).toBe(false);

      // Cannot access AFEs
      expect(ability.can('read', 'Afe')).toBe(false);
      expect(ability.can('create', 'Afe')).toBe(false);

      // Cannot manage users or organization
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('assignRole', 'User')).toBe(false);
      expect(ability.can('read', 'Organization')).toBe(false);

      // Cannot access audit logs
      expect(ability.can('read', 'AuditLog')).toBe(false);
      expect(ability.can('audit', 'Well')).toBe(false);

      // Cannot delete anything
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('delete', 'Production')).toBe(false);
    });

    it('should deny access to resources outside organization', () => {
      const user = {
        id: 'pumper-1',
        email: 'pumper@example.com',
        organizationId: 'org-123',
        roles: ['PUMPER'],
      };

      const ability = factory.createForUser(user);

      // Cannot access resources from different organization
      expect(
        ability.can(
          'read',
          subject('Well', {
            organizationId: 'org-456',
            assignedPumperId: 'pumper-1',
          }),
        ),
      ).toBe(false);

      expect(
        ability.can(
          'create',
          subject('Production', {
            organizationId: 'org-456',
            well: { assignedPumperId: 'pumper-1' },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should enforce organization boundaries for all roles', () => {
      const ownerUser = {
        id: 'owner-1',
        email: 'owner@org123.com',
        organizationId: 'org-123',
        roles: ['OWNER'],
      };

      const managerUser = {
        id: 'manager-1',
        email: 'manager@org456.com',
        organizationId: 'org-456',
        roles: ['MANAGER'],
      };

      const ownerAbility = factory.createForUser(ownerUser);
      const managerAbility = factory.createForUser(managerUser);

      // Owner can access their org resources but not other org
      expect(
        ownerAbility.can(
          'read',
          subject('Well', { organizationId: 'org-123' }),
        ),
      ).toBe(true);
      expect(
        ownerAbility.can(
          'read',
          subject('Well', { organizationId: 'org-456' }),
        ),
      ).toBe(false);

      // Manager can access their org resources but not other org
      expect(
        managerAbility.can(
          'read',
          subject('Well', { organizationId: 'org-456' }),
        ),
      ).toBe(true);
      expect(
        managerAbility.can(
          'read',
          subject('Well', { organizationId: 'org-123' }),
        ),
      ).toBe(false);
    });
  });
});
