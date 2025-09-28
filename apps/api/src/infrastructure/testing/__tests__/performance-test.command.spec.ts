import { PerformanceTestCommand } from '../performance-test.command';

describe('PerformanceTestCommand', () => {
  let command: PerformanceTestCommand;

  beforeEach(() => {
    const mockPerformanceTestService = {
      runPerformanceTestSuite: jest.fn(),
    };
    const mockConfigService = {
      get: jest.fn(),
    };
    const mockDb = {} as any;

    command = new PerformanceTestCommand(
      mockPerformanceTestService as any,
      mockConfigService as any,
      mockDb,
    );
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });
});
