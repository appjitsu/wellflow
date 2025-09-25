import { TxRrcPrAdapter } from '../infrastructure/adapters/tx-rrc-pr.adapter';
import { RegulatoryReportInstance } from '../domain/entities/regulatory-report-instance.entity';
import { Period } from '../domain/value-objects/period.vo';

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
          volume: 100,
          uom: 'BBL' as const,
        },
        {
          wellId: 'w1',
          apiNumber: '42123123456789',
          product: 'GAS' as const,
          volume: 200,
          uom: 'MCF' as const,
        },
      ],
    };
  }
}

describe('TxRrcPrAdapter', () => {
  it('builds a fixed-width TX PR file with header, details, and trailer', async () => {
    const adapter = new TxRrcPrAdapter(
      new MockNormalizedProductionService() as unknown as any,
    );
    const instance = new RegulatoryReportInstance(
      'id-123',
      'org-1',
      'TX',
      'PR',
      new Period('2024-08'),
      'draft',
    );

    const bytes = await adapter.buildFile(instance);
    const content = new TextDecoder().decode(bytes).trim().split('\n');

    // Header: HDR(3) TX(2) PR(2) ORG(12) PERIOD(6)
    expect(content[0]).toBe('HDRTXPRorg-1       202408');
    // Detail: PRD(3) API14(14) PROD(3) UOM(3) VOL_IMP2(12)
    expect(content[1]).toBe('PRD42123123456789OILBBL000000010000');
    expect(content[2]).toBe('PRD42123123456789GASMCF000000020000');
    // Trailer: TRL(3) COUNT(6)
    expect(content[3]).toBe('TRL000002');
  });
});
