import { ValidateRegulatoryReportCommand } from '../validate-regulatory-report.command';

describe('ValidateRegulatoryReportCommand', () => {
  it('should be defined', () => {
    const command = new ValidateRegulatoryReportCommand('report-123');
    expect(command).toBeDefined();
  });

  it('should have correct properties', () => {
    const command = new ValidateRegulatoryReportCommand('report-123');
    expect(command.reportId).toBe('report-123');
  });
});
