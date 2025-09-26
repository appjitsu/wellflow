import { CreateJibStatementHandler } from '../create-jib-statement.handler';
import { CreateJibStatementCommand } from '../../commands/create-jib-statement.command';
import type { IJibStatementRepository } from '../../../domain/repositories/jib-statement.repository.interface';
import type {
  LeaseRepository as ILeaseRepository,
  LeaseRecord,
} from '../../../domain/repositories/lease.repository.interface';
import type {
  PartnersRepository,
  PartnerRecord,
} from '../../../partners/domain/partners.repository';
import { JibStatement } from '../../../domain/entities/jib-statement.entity';

class JibRepoMock implements IJibStatementRepository {
  public lastCreateInput:
    | Parameters<IJibStatementRepository['create']>[0]
    | null = null;
  findById = () => Promise.resolve(null);
  create = (
    input: Parameters<IJibStatementRepository['create']>[0],
  ): Promise<JibStatement> => {
    this.lastCreateInput = input;
    return Promise.resolve(
      new JibStatement({
        id: 'new-jib',
        organizationId: input.organizationId,
        leaseId: input.leaseId,
        partnerId: input.partnerId,
        statementPeriodStart: input.statementPeriodStart,
        statementPeriodEnd: input.statementPeriodEnd,
        currentBalance: input.currentBalance ?? '0.00',
      }),
    );
  };
  save = (entity: JibStatement): Promise<JibStatement> =>
    Promise.resolve(entity);
}
class LeaseRepoMock implements ILeaseRepository {
  create = (): Promise<LeaseRecord> =>
    Promise.resolve({
      id: 'lease-1',
      organizationId: 'org-1',
    } as unknown as LeaseRecord);
  findById = (id: string): Promise<LeaseRecord | null> =>
    Promise.resolve({ id, organizationId: 'org-1' } as unknown as LeaseRecord);
  findAll = (): Promise<LeaseRecord[]> => Promise.resolve([]);
  findByStatus = (): Promise<LeaseRecord[]> => Promise.resolve([]);
  findExpiring = (): Promise<LeaseRecord[]> => Promise.resolve([]);
  update = (): Promise<LeaseRecord | null> => Promise.resolve(null);
  delete = (): Promise<boolean> => Promise.resolve(true);
}
class PartnersRepoMock implements PartnersRepository {
  create = (): Promise<PartnerRecord> =>
    Promise.resolve({
      id: 'p',
      organizationId: 'org-1',
    } as unknown as PartnerRecord);
  findById = (
    id: string,
    organizationId: string,
  ): Promise<PartnerRecord | null> =>
    Promise.resolve({ id, organizationId } as unknown as PartnerRecord);
  findAll = (): Promise<PartnerRecord[]> => Promise.resolve([]);
  update = (): Promise<PartnerRecord | null> => Promise.resolve(null);
  delete = (): Promise<boolean> => Promise.resolve(true);
}

describe('CreateJibStatementHandler validation', () => {
  it('throws when end < start', async () => {
    const handler = new CreateJibStatementHandler(
      new JibRepoMock(),
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    await expect(
      handler.execute(
        new CreateJibStatementCommand(
          'org-1',
          'lease-1',
          'partner-1',
          '2025-01-31',
          '2025-01-01',
          null,
        ),
      ),
    ).rejects.toThrow(
      'statementPeriodEnd must be on or after statementPeriodStart',
    );
  });

  it('passes with valid dates and existing lease/partner', async () => {
    const handler = new CreateJibStatementHandler(
      new JibRepoMock(),
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    const id = await handler.execute(
      new CreateJibStatementCommand(
        'org-1',
        'lease-1',
        'partner-1',
        '2025-01-01',
        '2025-01-31',
        '2025-02-15',
      ),
    );
    expect(id).toBe('new-jib');
  });

  it('throws when grossRevenue is negative', async () => {
    const repo = new JibRepoMock();
    const handler = new CreateJibStatementHandler(
      repo,
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    await expect(
      handler.execute(
        new CreateJibStatementCommand(
          'org-1',
          'lease-1',
          'partner-1',
          '2025-01-01',
          '2025-01-31',
          null,
          { grossRevenue: '-1.00' },
        ),
      ),
    ).rejects.toThrow('grossRevenue must be non-negative');
  });

  it('throws when status=paid and currentBalance > 0', async () => {
    const repo = new JibRepoMock();
    const handler = new CreateJibStatementHandler(
      repo,
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    await expect(
      handler.execute(
        new CreateJibStatementCommand(
          'org-1',
          'lease-1',
          'partner-1',
          '2025-01-01',
          '2025-01-31',
          null,
          { status: 'paid', currentBalance: '10.00' },
        ),
      ),
    ).rejects.toThrow('Cannot set status=paid when currentBalance > 0');
  });

  it('sets sentAt automatically when status=sent and sentAt not provided', async () => {
    const repo = new JibRepoMock();
    const handler = new CreateJibStatementHandler(
      repo,
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    const id = await handler.execute(
      new CreateJibStatementCommand(
        'org-1',
        'lease-1',
        'partner-1',
        '2025-01-01',
        '2025-01-31',
        null,
        { status: 'sent' },
      ),
    );
    expect(id).toBe('new-jib');
    expect(repo.lastCreateInput?.status).toBe('sent');
    expect(repo.lastCreateInput?.sentAt).toBeInstanceOf(Date);
  });

  it('throws when line item amount is negative', async () => {
    const handler = new CreateJibStatementHandler(
      new JibRepoMock(),
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    await expect(
      handler.execute(
        new CreateJibStatementCommand(
          'org-1',
          'lease-1',
          'partner-1',
          '2025-01-01',
          '2025-01-31',
          null,
          {
            lineItems: [
              { type: 'revenue', description: 'neg', amount: '-5.00' },
            ],
          },
        ),
      ),
    ).rejects.toThrow('Line item amounts must be non-negative decimal strings');
  });

  it('computes totals from quantity*unitCost when amount omitted', async () => {
    const repo = new JibRepoMock();
    const handler = new CreateJibStatementHandler(
      repo,
      new LeaseRepoMock(),
      new PartnersRepoMock(),
    );
    const id = await handler.execute(
      new CreateJibStatementCommand(
        'org-1',
        'lease-1',
        'partner-1',
        '2025-01-01',
        '2025-01-31',
        null,
        {
          lineItems: [
            {
              type: 'revenue',
              description: 'units',
              quantity: '2',
              unitCost: '50.00',
            },
            { type: 'expense', description: 'fee', amount: '30.00' },
          ],
        },
      ),
    );
    expect(id).toBe('new-jib');
    expect(repo.lastCreateInput?.grossRevenue).toBe('100.00');
    expect(repo.lastCreateInput?.netRevenue).toBe('70.00');
  });
});
