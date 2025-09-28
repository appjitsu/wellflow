import { GenerateRegulatoryReportCommand } from '../generate-regulatory-report.command';

describe('GenerateRegulatoryReportCommand', () => {
  it('should create a valid command', () => {
    const command = new GenerateRegulatoryReportCommand(
      'org-123',
      'TX',
      'PR',
      '2023-01',
      'user-456',
    );
    expect(command).toBeDefined();
    expect(command.organizationId).toBe('org-123');
    expect(command.jurisdiction).toBe('TX');
  });
});
