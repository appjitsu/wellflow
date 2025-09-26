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
  findById = () => Promise.resolve(null);
  create = (
    input: Parameters<IJibStatementRepository['create']>[0],
  ): Promise<JibStatement> =>
    Promise.resolve(
      new JibStatement({
        id: 'new-jib',
        organizationId: input.organizationId,
        leaseId: input.leaseId,
        partnerId: input.partnerId,
        statementPeriodStart: input.statementPeriodStart,
        statementPeriodEnd: input.statementPeriodEnd,
        dueDate: input.dueDate ?? null,
        currentBalance: '0.00',
      }),
    );
  save = (entity: JibStatement) => Promise.resolve(entity);
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

describe('CreateJibStatementHandler', () => {
  it('creates a JIB statement and returns id', async () => {
    const handler = new CreateJibStatementHandler(
      new JibRepoMock() as IJibStatementRepository,
      new LeaseRepoMock() as ILeaseRepository,
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
});
