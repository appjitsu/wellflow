import { CreateOwnerPaymentHandler } from '../create-owner-payment.handler';
import { CreateOwnerPaymentCommand } from '../../commands/create-owner-payment.command';
import type { IOwnerPaymentRepository } from '../../../domain/repositories/owner-payment.repository.interface';
import { EventBus } from '@nestjs/cqrs';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { OwnerPayment } from '../../../domain/entities/owner-payment.entity';

class RepoMock implements IOwnerPaymentRepository {
  save = jest.fn((e: OwnerPayment) => Promise.resolve(e));
  findById = jest.fn(() => Promise.resolve(null));
  findByOrganizationId = jest.fn(() => Promise.resolve([]));
}

class OutboxMock {
  record = jest.fn(() => Promise.resolve(undefined));
}

class EventBusMock {
  publish = jest.fn();
}

describe('CreateOwnerPaymentHandler', () => {
  let handler: CreateOwnerPaymentHandler;
  let repo: RepoMock;
  let outbox: OutboxMock;

  beforeEach(() => {
    repo = new RepoMock();
    outbox = new OutboxMock();
    handler = new CreateOwnerPaymentHandler(
      repo as unknown as IOwnerPaymentRepository,
      new EventBusMock() as unknown as EventBus,
      outbox as unknown as OutboxService,
    );
  });

  it('rejects invalid amounts', async () => {
    await expect(
      handler.execute(
        new CreateOwnerPaymentCommand(
          'org-1',
          'partner-1',
          'CHECK',
          '100', // invalid
          '100.00',
          'rd-1',
        ),
      ),
    ).rejects.toBeTruthy();
  });

  it('creates payment and records outbox', async () => {
    const id = await handler.execute(
      new CreateOwnerPaymentCommand(
        'org-1',
        'partner-1',
        'ACH',
        '150.00',
        '120.00',
        'rd-1',
        { deductionsAmount: '20.00', taxWithheldAmount: '10.00' },
      ),
    );
    expect(typeof id).toBe('string');
    expect(repo.save).toHaveBeenCalled();
    expect(outbox.record).toHaveBeenCalled();
  });
});
