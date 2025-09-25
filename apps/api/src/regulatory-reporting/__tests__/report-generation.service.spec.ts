import { ReportGenerationService } from '../application/services/report-generation.service';
import { InMemoryReportInstanceRepository } from '../infrastructure/repositories/in-memory-report-instance.repository';

describe('ReportGenerationService', () => {
  it('generates and persists a draft instance', async () => {
    const repo = new InMemoryReportInstanceRepository();
    const svc = new ReportGenerationService(repo as any);

    const instance = await svc.generate(
      'org-1',
      'TX',
      'PR',
      '2024-08',
      'user-1',
    );
    expect(instance.getOrganizationId()).toBe('org-1');
    expect(instance.getJurisdiction()).toBe('TX');
    expect(instance.getReportType()).toBe('PR');
    expect(instance.getPeriod().toString()).toBe('2024-08');

    const loaded = await repo.findById(instance.getId());
    expect(loaded).not.toBeNull();
  });
});
