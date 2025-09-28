import { SubmitRegulatoryReportCommand } from '../submit-regulatory-report.command';

describe('SubmitRegulatoryReportCommand', () => {
  let command: SubmitRegulatoryReportCommand;

  beforeEach(() => {
    command = new SubmitRegulatoryReportCommand('test-report-id', 'ORIGINAL');
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(command.reportId).toBe('test-report-id');
    expect(command.amendmentType).toBe('ORIGINAL');
  });
});
