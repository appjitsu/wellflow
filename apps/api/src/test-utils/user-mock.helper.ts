/**
 * Test user interface that extends the base user type
 * to include additional properties needed for testing
 */
export interface TestUser {
  id?: string;
  email?: string;
  roles?: string[];
  operatorId?: string;
  agency?: string;
  permissions?: string[];
  company?: string;
  systemAccess?: boolean;
  jurisdiction?: string;
}

/**
 * Creates a mock user for testing with proper typing
 */
export function createMockUser(overrides: Partial<TestUser> = {}): TestUser {
  const defaults: TestUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['OPERATOR'],
  };

  return { ...defaults, ...overrides };
}

/**
 * Creates a mock operator user
 */
export function createMockOperatorUser(
  overrides: Partial<TestUser> = {},
): TestUser {
  return createMockUser({
    roles: ['OPERATOR'],
    operatorId: 'TX-OP-456',
    company: 'Texas Oil Company',
    ...overrides,
  });
}

/**
 * Creates a mock regulator user
 */
export function createMockRegulatorUser(
  overrides: Partial<TestUser> = {},
): TestUser {
  return createMockUser({
    roles: ['REGULATOR', 'AUDITOR'],
    agency: 'Texas Railroad Commission',
    jurisdiction: 'Texas',
    ...overrides,
  });
}

/**
 * Creates a mock admin user
 */
export function createMockAdminUser(
  overrides: Partial<TestUser> = {},
): TestUser {
  return createMockUser({
    roles: ['ADMIN'],
    permissions: ['ALL'],
    systemAccess: true,
    ...overrides,
  });
}
