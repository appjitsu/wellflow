import { UpdateJibLinkCashCallHandler } from '../update-jib-link-cash-call.handler';
import { UpdateJibLinkCashCallCommand } from '../../commands/update-jib-link-cash-call.command';
import type { IJibStatementRepository } from '../../../domain/repositories/jib-statement.repository.interface';
import type { ICashCallRepository } from '../../../domain/repositories/cash-call.repository.interface';
import { JibBalanceService } from '../../../financial/jib-balance.service';
import { JibLinkingService } from '../../../financial/jib-linking.service';
import { JibStatement } from '../../../domain/entities/jib-statement.entity';
import { CashCall } from '../../../domain/entities/cash-call.entity';

class JibRepoMock implements IJibStatementRepository {
  entity: JibStatement | null = new JibStatement({
    id: 'jib-1',
    organizationId: 'org-1',
    leaseId: 'lease-1',
    partnerId: 'partner-1',
    statementPeriodEnd: '2025-01-31',
    currentBalance: '100.00',
    dueDate: '2025-02-15',
  });
  findById = () => Promise.resolve(this.entity);
  create = (
    input: Parameters<IJibStatementRepository['create']>[0],
  ): Promise<JibStatement> =>
    Promise.resolve(
      new JibStatement({
        id: 'new',
        organizationId: input.organizationId,
        leaseId: input.leaseId,
        partnerId: input.partnerId,
        statementPeriodStart: input.statementPeriodStart,
        statementPeriodEnd: input.statementPeriodEnd,
        currentBalance: '0.00',
      }),
    );
  save = (entity: JibStatement): Promise<JibStatement> => {
    this.entity = entity;
    return Promise.resolve(entity);
  };
}
class CashRepoMock implements ICashCallRepository {
  findById = () => Promise.resolve<CashCall | null>(null);
  findByOrganizationId = (): Promise<CashCall[]> =>
    Promise.resolve([
      new CashCall({
        organizationId: 'org-1',
        leaseId: 'lease-1',
        partnerId: 'partner-1',
        billingMonth: '2025-01-01',
        amount: '50.00',
        type: 'MONTHLY',
        status: 'SENT',
        consentRequired: false,
      }),
    ]);
  save = (entity: CashCall): Promise<CashCall> => Promise.resolve(entity);
}

describe('UpdateJibLinkCashCallHandler', () => {
  it('links and accrues interest', async () => {
    const handler = new UpdateJibLinkCashCallHandler(
      new JibRepoMock(),
      new CashRepoMock(),
      new JibBalanceService(),
      new JibLinkingService(),
    );
    const res = await handler.execute(
      new UpdateJibLinkCashCallCommand('org-1', 'jib-1', '12.00', 365),
    );
    expect(res.jibId).toBe('jib-1');
    expect(typeof res.interestAccrued).toBe('string');
  });
});
