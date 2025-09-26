import { CreateJoaHandler } from '../create-joa.handler';
import { CreateJoaCommand } from '../../commands/create-joa.command';
import type { IJoaRepository } from '../../../domain/repositories/joa.repository.interface';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { JointOperatingAgreement } from '../../../domain/entities/joint-operating-agreement.entity';

class RepoMock implements IJoaRepository {
  save = jest.fn((e: JointOperatingAgreement) => Promise.resolve(e));
  findById = jest.fn(() => Promise.resolve(null));
  findByOrganizationId = jest.fn(() => Promise.resolve([]));
}

class OutboxMock {
  record = jest.fn(() => Promise.resolve(undefined));
}

describe('CreateJoaHandler', () => {
  let handler: CreateJoaHandler;
  let repo: RepoMock;
  let outbox: OutboxMock;

  beforeEach(() => {
    repo = new RepoMock();
    outbox = new OutboxMock();
    handler = new CreateJoaHandler(
      repo as unknown as IJoaRepository,
      outbox as unknown as OutboxService,
    );
  });

  it('rejects invalid effective date', async () => {
    await expect(
      handler.execute(new CreateJoaCommand('org-1', 'AG-100', '20250101')),
    ).rejects.toBeTruthy();
  });

  it('creates joa and records outbox', async () => {
    const id = await handler.execute(
      new CreateJoaCommand('org-1', 'AG-100', '2025-01-01', {
        votingThresholdPercent: '66.67',
      }),
    );
    expect(typeof id).toBe('string');
    expect(repo.save).toHaveBeenCalled();
    expect(outbox.record).toHaveBeenCalled();
  });
});
