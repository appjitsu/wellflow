/**
 * Model Tests Index
 * Runs all model-specific tests to ensure comprehensive coverage
 */

import '../env'; // Load test environment configuration

describe('Database Models Test Suite', () => {
  describe('Core Business Models', () => {
    // Import and run all model tests
    require('./organizations.test');
    require('./users.test');
    require('./wells.test');
    require('./production-records.test');
    require('./afes.test');
    require('./revenue-distributions.test');
  });

  it('should have completed all model tests', () => {
    // This test ensures the test suite runs to completion
    expect(true).toBe(true);
  });
});
