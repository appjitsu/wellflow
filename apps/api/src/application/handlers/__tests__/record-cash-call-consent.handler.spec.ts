import { RecordCashCallConsentHandler } from '../record-cash-call-consent.handler';
import { RecordCashCallConsentCommand } from '../../commands/record-cash-call-consent.command';
import type { ICashCallRepository } from '../../../domain/repositories/cash-call.repository.interface';
import { CashCall } from '../../../domain/entities/cash-call.entity';

class RepoMock implements ICashCallRepository {
  private entity: CashCall | null = null;
  constructor() {
    this.entity = new CashCall({
      organizationId: 'org-1',
      leaseId: 'lease-1',
      partnerId: 'partner-1',
      billingMonth: '2025-01-01',
      amount: '100.00',
      type: 'MONTHLY',
      status: 'DRAFT',
      consentRequired: true,
    });
  }
  save(e: CashCall): Promise<CashCall> {
    this.entity = e;
    return Promise.resolve(e);
  }
  findById(): Promise<CashCall | null> {
    return Promise.resolve(this.entity);
  }
  findByOrganizationId(): Promise<CashCall[]> {
    return Promise.resolve([]);
  }
}

describe('RecordCashCallConsentHandler', () => {
  it('records RECEIVED consent', async () => {
    const repo = new RepoMock();
    const handler = new RecordCashCallConsentHandler(
      repo as unknown as ICashCallRepository,
    );
    const id = await handler.execute(
      new RecordCashCallConsentCommand(
        'org-1',
        'id-1',
        'RECEIVED',
        '2025-01-15',
      ),
    );
    expect(typeof id).toBe('string');
  });
});
