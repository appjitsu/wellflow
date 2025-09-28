import { JSONRegulatoryReportFormatStrategy } from '../regulatory-report-format.strategy';

describe('JSONRegulatoryReportFormatStrategy', () => {
  it('should be defined', () => {
    const strategy = new JSONRegulatoryReportFormatStrategy();

    expect(strategy).toBeDefined();
    expect(strategy.getFormatType()).toBe('json');
  });
});
