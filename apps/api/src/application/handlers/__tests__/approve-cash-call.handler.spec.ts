import { ApproveCashCallHandler } from '../approve-cash-call.handler';
import { ApproveCashCallCommand } from '../../commands/approve-cash-call.command';
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
      status: 'SENT',
      consentRequired: false,
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

describe('ApproveCashCallHandler', () => {
  it('approves cash call', async () => {
    const repo = new RepoMock();
    const handler = new ApproveCashCallHandler(
      repo as unknown as ICashCallRepository,
    );
    const id = await handler.execute(
      new ApproveCashCallCommand('org-1', 'id-1'),
    );
    expect(typeof id).toBe('string');
  });

  it('throws if consent required but not RECEIVED', async () => {
    const repo = new RepoMock();
    // Override entity to require consent; constructor defaults consentStatus to REQUIRED
    (repo as any).entity = new CashCall({
      organizationId: 'org-1',
      leaseId: 'lease-1',
      partnerId: 'partner-1',
      billingMonth: '2025-01-01',
      amount: '100.00',
      type: 'MONTHLY',
      status: 'SENT',
      consentRequired: true,
    });
    const handler = new ApproveCashCallHandler(
      repo as unknown as ICashCallRepository,
    );
    await expect(
      handler.execute(new ApproveCashCallCommand('org-1', 'id-1')),
    ).rejects.toThrow('Consent must be RECEIVED before approval');
  });
});
