/**
 * Test Utilities
 *
 * Helper functions for generating unique test data to prevent conflicts
 */

/**
 * Generate a unique email address for testing
 * Uses timestamp and random number to ensure uniqueness
 */
export function generateUniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a unique API number for oil & gas wells
 * Format: 14-digit number starting with 42123 (Texas state code)
 */
export function generateUniqueApiNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `42123${timestamp}${random}`.slice(0, 14);
}

/**
 * Generate a unique organization name for testing
 */
export function generateUniqueOrgName(prefix = 'Test Org'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique well name for testing
 */
export function generateUniqueWellName(prefix = 'Test Well'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100); // eslint-disable-line sonarjs/pseudo-random
  return `${prefix} #${random}-${timestamp}`;
}

/**
 * Generate a unique lease name for testing
 */
export function generateUniqueLeaseName(prefix = 'Test Lease'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique partner name for testing
 */
export function generateUniquePartnerName(prefix = 'Test Partner'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique tax ID for testing
 */
export function generateUniqueTaxId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `${timestamp.slice(0, 2)}-${timestamp.slice(2)}${random}`;
}

/**
 * Generate a unique phone number for testing
 */
export function generateUniquePhone(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `(432) 555-${timestamp.slice(0, 4)}`;
}

/**
 * Sleep utility for tests that need timing delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate test user data with unique values
 */
export function generateTestUser(
  overrides: Partial<{
    organizationId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'owner' | 'manager' | 'operator' | 'viewer';
    isActive: boolean;
  }> = {},
) {
  return {
    email: generateUniqueEmail(),
    firstName: 'Test',
    lastName: 'User',
    role: 'owner' as const,
    isActive: true,
    ...overrides,
  };
}

/**
 * Generate test organization data with unique values
 */
export function generateTestOrganization(
  overrides: Partial<{
    name: string;
    taxId: string;
    email: string;
    phone: string;
  }> = {},
) {
  return {
    name: generateUniqueOrgName(),
    taxId: generateUniqueTaxId(),
    email: generateUniqueEmail('org'),
    phone: generateUniquePhone(),
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
    },
    settings: {
      timezone: 'America/Chicago',
      currency: 'USD',
      units: 'imperial',
    },
    ...overrides,
  };
}

/**
 * Generate test well data with unique values
 */
export function generateTestWell(
  overrides: Partial<{
    organizationId: string;
    leaseId: string;
    apiNumber: string;
    wellName: string;
    wellType: 'OIL' | 'GAS' | 'water' | 'injection';
    status: 'ACTIVE' | 'INACTIVE' | 'plugged' | 'drilling';
  }> = {},
) {
  return {
    apiNumber: generateUniqueApiNumber(),
    wellName: generateUniqueWellName(),
    wellType: 'OIL' as const,
    status: 'ACTIVE' as const,
    ...overrides,
  };
}
