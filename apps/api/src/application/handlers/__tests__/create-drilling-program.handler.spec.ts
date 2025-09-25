import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateDrillingProgramHandler } from '../create-drilling-program.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CreateDrillingProgramCommand } from '../../commands/create-drilling-program.command';
import type { IDrillingProgramRepository } from '../../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgram } from '../../../domain/entities/drilling-program.entity';

class InMemoryDrillingProgramRepo implements IDrillingProgramRepository {
  private store = new Map<string, DrillingProgram>();

  save(program: DrillingProgram): Promise<DrillingProgram> {
    this.store.set(program.getId(), program);
    return Promise.resolve(program);
  }

  findById(id: string): Promise<DrillingProgram | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByOrganizationId(): Promise<DrillingProgram[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  findByWellId(): Promise<DrillingProgram[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}

describe('CreateDrillingProgramHandler', () => {
  it('creates and returns id', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateDrillingProgramHandler,
        {
          provide: 'DrillingProgramRepository',
          useClass: InMemoryDrillingProgramRepo,
        },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(CreateDrillingProgramHandler);
    const cmd = new CreateDrillingProgramCommand(
      'org-1',
      'well-1',
      'Program A',
    );
    const id = await handler.execute(cmd);
    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    expect(id).toBeDefined();
    const repo = moduleRef.get<IDrillingProgramRepository>(
      'DrillingProgramRepository',
    );
    const saved = await repo.findById(id);
    expect(saved?.getProgramName()).toBe('Program A');
  });
});
