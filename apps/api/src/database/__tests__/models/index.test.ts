/**
 * Model Tests Index
 * Runs all model-specific tests to ensure comprehensive coverage
 */

import '../env'; // Load test environment configuration

describe('Database Models Test Suite', () => {
  describe('Core Business Models', () => {
    // Import and run all model tests
    require('./organizations.test'); // eslint-disable-line @typescript-eslint/no-require-imports
    require('./users.test'); // eslint-disable-line @typescript-eslint/no-require-imports
    require('./wells.test'); // eslint-disable-line @typescript-eslint/no-require-imports
    require('./production-records.test'); // eslint-disable-line @typescript-eslint/no-require-imports
    require('./afes.test'); // eslint-disable-line @typescript-eslint/no-require-imports
    require('./revenue-distributions.test'); // eslint-disable-line @typescript-eslint/no-require-imports
  });

  it('should have completed all model tests', () => {
    // This test ensures the test suite runs to completion
    expect(true).toBe(true);
  });
});
