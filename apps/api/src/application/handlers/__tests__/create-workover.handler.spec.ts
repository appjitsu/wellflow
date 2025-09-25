import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateWorkoverHandler } from '../create-workover.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CreateWorkoverCommand } from '../../commands/create-workover.command';
import type { IWorkoverRepository } from '../../../domain/repositories/workover.repository.interface';
import { Workover } from '../../../domain/entities/workover.entity';

class InMemoryWorkoverRepo implements IWorkoverRepository {
  private store = new Map<string, Workover>();

  save(entity: Workover): Promise<Workover> {
    this.store.set(entity.getId(), entity);
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<Workover | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByOrganizationId(): Promise<Workover[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  findByWellId(): Promise<Workover[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}

describe('CreateWorkoverHandler', () => {
  it('creates and returns id', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateWorkoverHandler,
        { provide: 'WorkoverRepository', useClass: InMemoryWorkoverRepo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(CreateWorkoverHandler);
    const cmd = new CreateWorkoverCommand('org-1', 'well-1', {
      reason: 'Pump change',
    });
    const id = await handler.execute(cmd);
    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    expect(id).toBeDefined();
    const repo = moduleRef.get<IWorkoverRepository>('WorkoverRepository');
    const saved = await repo.findById(id);
    expect(saved?.getReason()).toBe('Pump change');
  });
});
