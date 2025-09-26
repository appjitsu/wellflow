import { CreateCashCallHandler } from '../create-cash-call.handler';
import { CreateCashCallCommand } from '../../commands/create-cash-call.command';
import type { ICashCallRepository } from '../../../domain/repositories/cash-call.repository.interface';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CashCall } from '../../../domain/entities/cash-call.entity';

class RepoMock implements ICashCallRepository {
  save = jest.fn((e: CashCall) => Promise.resolve(e));
  findById = jest.fn(() => Promise.resolve(null));
  findByOrganizationId = jest.fn(() => Promise.resolve([]));
}

class OutboxMock {
  record = jest.fn(() => Promise.resolve(undefined));
}

describe('CreateCashCallHandler', () => {
  let handler: CreateCashCallHandler;
  let repo: RepoMock;
  let outbox: OutboxMock;

  beforeEach(() => {
    repo = new RepoMock();
    outbox = new OutboxMock();
    handler = new CreateCashCallHandler(
      repo as unknown as ICashCallRepository,
      outbox as unknown as OutboxService,
    );
  });

  it('rejects invalid amount', async () => {
    await expect(
      handler.execute(
        new CreateCashCallCommand(
          'org-1',
          'lease-1',
          'partner-1',
          '2025-01-01',
          '100',
          'MONTHLY',
        ),
      ),
    ).rejects.toBeTruthy();
  });

  it('creates cash call and records outbox', async () => {
    const id = await handler.execute(
      new CreateCashCallCommand(
        'org-1',
        'lease-1',
        'partner-1',
        '2025-01-01',
        '100.00',
        'MONTHLY',
        {
          dueDate: '2025-01-15',
          interestRatePercent: '12.00',
          consentRequired: true,
        },
      ),
    );
    expect(typeof id).toBe('string');
    expect(repo.save).toHaveBeenCalled();
    expect(outbox.record).toHaveBeenCalled();
  });
});
