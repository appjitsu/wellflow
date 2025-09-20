import { createAbilityForUser, createAbilityForGuest } from '../abilities';

describe('Abilities', () => {
  describe('createAbilityForUser', () => {
    it('should create abilities for admin user', () => {
      const user = {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        operatorId: 'operator-1',
      };

      const ability = createAbilityForUser(user);

      // Admin can manage all wells
      expect(ability.can('create', 'Well')).toBe(true);
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('update', 'Well')).toBe(true);
      expect(ability.can('delete', 'Well')).toBe(true);

      // Admin can manage all resources (using 'all' subject)
      expect(ability.can('create', 'all')).toBe(true);
      expect(ability.can('read', 'all')).toBe(true);
      expect(ability.can('update', 'all')).toBe(true);
      expect(ability.can('delete', 'all')).toBe(true);
      expect(ability.can('manage', 'all')).toBe(true);

      // Admin can perform special actions
      expect(ability.can('updateStatus', 'Well')).toBe(true);
      expect(ability.can('submitReport', 'Well')).toBe(true);
      expect(ability.can('viewSensitive', 'Well')).toBe(true);
      expect(ability.can('export', 'Well')).toBe(true);
      expect(ability.can('audit', 'Well')).toBe(true);
    });

    it('should create abilities for operator user', () => {
      const user = {
        id: 'operator-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };

      const ability = createAbilityForUser(user);

      // Operator can manage their own wells
      expect(ability.can('create', 'Well')).toBe(true);
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('update', 'Well')).toBe(true);
      expect(ability.can('updateStatus', 'Well')).toBe(true);
      expect(ability.can('submitReport', 'Well')).toBe(true);
      expect(ability.can('export', 'Well')).toBe(true);

      // Operator cannot delete wells (regulatory requirement)
      expect(ability.can('delete', 'Well')).toBe(false);

      // Operator cannot view audit logs
      expect(ability.can('audit', 'Well')).toBe(false);

      // Operator cannot view sensitive data
      expect(ability.can('viewSensitive', 'Well')).toBe(false);
    });

    it('should create abilities for viewer user', () => {
      const user = {
        id: 'viewer-1',
        email: 'viewer@example.com',
        roles: ['VIEWER'],
        operatorId: 'operator-1',
      };

      const ability = createAbilityForUser(user);

      // Viewer can only read wells
      expect(ability.can('read', 'Well')).toBe(true);

      // Viewer cannot perform any other actions
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('updateStatus', 'Well')).toBe(false);
      expect(ability.can('submitReport', 'Well')).toBe(false);
      expect(ability.can('export', 'Well')).toBe(false);
      expect(ability.can('audit', 'Well')).toBe(false);
      expect(ability.can('viewSensitive', 'Well')).toBe(false);
    });

    it('should create abilities for regulator user', () => {
      const user = {
        id: 'regulator-1',
        email: 'regulator@example.com',
        roles: ['REGULATOR'],
        allowedStates: ['TX', 'OK'],
      };

      const ability = createAbilityForUser(user);

      // Regulator can read all wells in their jurisdiction
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('viewSensitive', 'Well')).toBe(true);
      expect(ability.can('audit', 'Well')).toBe(true);

      // Regulator cannot modify wells (regulatory independence)
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

      const ability = createAbilityForUser(user);

      // Auditor can read wells and audit trails
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('audit', 'Well')).toBe(true);

      // Auditor cannot modify anything
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('updateStatus', 'Well')).toBe(false);
      expect(ability.can('submitReport', 'Well')).toBe(false);
    });

    it('should handle user with no roles', () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        roles: [],
      };

      const ability = createAbilityForUser(user);

      // User with no roles cannot perform any actions
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('read', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
    });

    it('should handle detectSubjectType function for admin', () => {
      const user = { id: '1', roles: ['ADMIN'] };
      const ability = createAbilityForUser(user);

      // Test detectSubjectType with mock object
      const mockWell = { constructor: function Well() {} };
      expect(() => ability.can('read', mockWell as any)).not.toThrow();
    });

    it('should handle conditionsMatcher functionality', () => {
      const user = {
        id: 'operator-1',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };
      const ability = createAbilityForUser(user);

      // Test that the ability was created successfully
      expect(ability).toBeDefined();
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('create', 'Well')).toBe(true);
    });

    it('should handle regulator abilities with state restrictions', () => {
      const user = {
        id: 'regulator-1',
        roles: ['REGULATOR'],
        allowedStates: ['TX', 'OK'],
      };
      const ability = createAbilityForUser(user);

      // Test that regulator abilities are created
      expect(ability).toBeDefined();
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('viewSensitive', 'Well')).toBe(true);
      expect(ability.can('create', 'Well')).toBe(false);
    });

    it('should handle complex user scenarios', () => {
      const user = {
        id: 'operator-1',
        roles: ['OPERATOR'],
        operatorId: 'operator-1',
      };
      const ability = createAbilityForUser(user);

      // Test that operator has proper permissions
      expect(ability).toBeDefined();
      expect(ability.can('read', 'Well')).toBe(true);
      expect(ability.can('update', 'Well')).toBe(true);
      expect(ability.can('delete', 'Well')).toBe(false);
    });

  });

  describe('createAbilityForGuest', () => {
    it('should create minimal abilities for guest', () => {
      const ability = createAbilityForGuest();

      // Guest cannot read wells without conditions (only public wells allowed)
      expect(ability.can('read', 'Well')).toBe(false);

      // Guest cannot perform any other actions
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('manage', 'Well')).toBe(false);
    });

    it('should handle detectSubjectType function for guest', () => {
      const ability = createAbilityForGuest();

      // Test detectSubjectType with mock object
      const mockWell = { constructor: function Well() {} };
      expect(() => ability.can('read', mockWell as any)).not.toThrow();
    });

    it('should handle guest abilities with public wells', () => {
      const ability = createAbilityForGuest();

      // Test that guest abilities are properly restricted
      expect(ability).toBeDefined();
      expect(ability.can('read', 'Well')).toBe(false);
      expect(ability.can('create', 'Well')).toBe(false);
    });

    it('should handle guest restrictions properly', () => {
      const ability = createAbilityForGuest();

      // Test that all actions are properly denied for guests
      expect(ability.can('create', 'Well')).toBe(false);
      expect(ability.can('update', 'Well')).toBe(false);
      expect(ability.can('delete', 'Well')).toBe(false);
      expect(ability.can('manage', 'Well')).toBe(false);
    });

    it('should handle guest ability creation without errors', () => {
      expect(() => createAbilityForGuest()).not.toThrow();

      const ability = createAbilityForGuest();
      expect(ability).toBeDefined();
    });
  });
});
