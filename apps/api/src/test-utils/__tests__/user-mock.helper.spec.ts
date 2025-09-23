import {
  createMockUser,
  createMockOperatorUser,
  createMockRegulatorUser,
  createMockAdminUser,
} from '../user-mock.helper';

describe('User Mock Helper', () => {
  describe('createMockUser', () => {
    it('should create a user with default values', () => {
      const user = createMockUser();

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['OPERATOR'],
      });
    });

    it('should override default values with provided overrides', () => {
      const user = createMockUser({
        id: 'custom-id',
        email: 'custom@example.com',
        roles: ['ADMIN'],
      });

      expect(user).toEqual({
        id: 'custom-id',
        email: 'custom@example.com',
        roles: ['ADMIN'],
      });
    });

    it('should merge overrides with defaults', () => {
      const user = createMockUser({
        email: 'custom@example.com',
      });

      expect(user).toEqual({
        id: 'user-123',
        email: 'custom@example.com',
        roles: ['OPERATOR'],
      });
    });
  });

  describe('createMockOperatorUser', () => {
    it('should create an operator user with default values', () => {
      const user = createMockOperatorUser();

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
        company: 'Texas Oil Company',
      });
    });

    it('should override operator-specific defaults', () => {
      const user = createMockOperatorUser({
        operatorId: 'custom-op',
        company: 'Custom Company',
      });

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['OPERATOR'],
        operatorId: 'custom-op',
        company: 'Custom Company',
      });
    });
  });

  describe('createMockRegulatorUser', () => {
    it('should create a regulator user with default values', () => {
      const user = createMockRegulatorUser();

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['REGULATOR', 'AUDITOR'],
        agency: 'Texas Railroad Commission',
        jurisdiction: 'Texas',
      });
    });
  });

  describe('createMockAdminUser', () => {
    it('should create an admin user with default values', () => {
      const user = createMockAdminUser();

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        roles: ['ADMIN'],
        systemAccess: true,
        permissions: ['ALL'],
      });
    });
  });
});
