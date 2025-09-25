import { Test } from '@nestjs/testing';
import { GetWorkoverByIdHandler } from '../get-workover-by-id.handler';
import { GetWorkoverByIdQuery } from '../../queries/get-workover-by-id.query';
import type { IWorkoverRepository } from '../../../domain/repositories/workover.repository.interface';
import { Workover } from '../../../domain/entities/workover.entity';
import { WorkoverStatus } from '../../../domain/enums/workover-status.enum';

class StubWorkoverRepo implements IWorkoverRepository {
  private item?: Workover;

  save(entity: Workover): Promise<Workover> {
    this.item = entity;
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<Workover | null> {
    return Promise.resolve(
      this.item && this.item.getId() === id ? this.item : null,
    );
  }

  findByOrganizationId(): Promise<Workover[]> {
    return Promise.resolve(this.item ? [this.item] : []);
  }

  findByWellId(): Promise<Workover[]> {
    return Promise.resolve(this.item ? [this.item] : []);
  }
}

describe(GetWorkoverByIdHandler.name, () => {
  it('returns dto for existing workover', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetWorkoverByIdHandler,
        { provide: 'WorkoverRepository', useClass: StubWorkoverRepo },
      ],
    }).compile();

    const repo = moduleRef.get<IWorkoverRepository>('WorkoverRepository');
    const entity = new Workover({
      id: 'w1',
      organizationId: 'org',
      wellId: 'well',
      status: WorkoverStatus.PLANNED,
      reason: 'fix',
    });
    await repo.save(entity);

    const handler = moduleRef.get(GetWorkoverByIdHandler);
    const dto = await handler.execute(new GetWorkoverByIdQuery('w1'));
    expect(dto.id).toBe('w1');
    expect(dto.reason).toBe('fix');
  });
});
