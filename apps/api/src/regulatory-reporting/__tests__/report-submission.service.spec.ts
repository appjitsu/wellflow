import { ReportSubmissionService } from '../application/services/report-submission.service';
import { InMemoryReportInstanceRepository } from '../infrastructure/repositories/in-memory-report-instance.repository';
import { AdapterRegistryService } from '../application/services/adapter-registry.service';
import { TxRrcPrAdapter } from '../infrastructure/adapters/tx-rrc-pr.adapter';
import { RegulatoryReportInstance } from '../domain/entities/regulatory-report-instance.entity';
import { Period } from '../domain/value-objects/period.vo';
import { CircuitBreaker } from '../../common/resilience/circuit-breaker';

class MockNormalizedProductionService {
  buildMonthlyForOrganization(organizationId: string, period: string) {
    return {
      organizationId,
      period,
      lines: [
        {
          wellId: 'w1',
          apiNumber: '42123123456789',
          product: 'OIL' as const,
          volume: 1,
          uom: 'BBL' as const,
        },
      ],
    };
  }
}

describe('ReportSubmissionService', () => {
  it('submits via TX adapter under circuit breaker', async () => {
    const repo = new InMemoryReportInstanceRepository();
    const instance = new RegulatoryReportInstance(
      'rid-1',
      'org-1',
      'TX',
      'PR',
      new Period('2024-08'),
      'draft',
    );
    await repo.save(instance);

    const adapter = new TxRrcPrAdapter(
      new MockNormalizedProductionService() as any,
    );
    const registry = new AdapterRegistryService(adapter);
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 1000,
      halfOpenMaxCalls: 1,
    });

    const svc = new ReportSubmissionService(repo as any, registry, breaker);

    const receipt = await svc.submit('rid-1');
    expect(receipt.accepted).toBe(true);
  });
});
