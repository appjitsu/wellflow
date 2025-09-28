describe('Test Setup', () => {
  it('should have global WellFlow test utilities defined', () => {
    expect((global as any).WellFlowTestUtils).toBeDefined();
    expect(typeof (global as any).WellFlowTestUtils.createTestWell).toBe(
      'function',
    );
    expect(typeof (global as any).WellFlowTestUtils.createTestProduction).toBe(
      'function',
    );
    expect(
      typeof (global as any).WellFlowTestUtils.createTestRegulatoryReport,
    ).toBe('function');
    expect(typeof (global as any).WellFlowTestUtils.mockApiResponse).toBe(
      'function',
    );
    expect(typeof (global as any).WellFlowTestUtils.waitFor).toBe('function');
  });

  it('should have test environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.WELLFLOW_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret-for-testing-only');
    expect(process.env.REDIS_URL).toBe('redis://localhost:6379/1');
  });

  it('should have global test configuration', () => {
    expect((global as any).WELLFLOW_TEST_CONFIG).toBeDefined();
    expect((global as any).WELLFLOW_TEST_CONFIG.REGULATORY_STANDARDS).toContain(
      'API_1164',
    );
    expect(
      (global as any).WELLFLOW_TEST_CONFIG.PERFORMANCE_THRESHOLDS
        .API_RESPONSE_TIME,
    ).toBe(500);
  });
});
