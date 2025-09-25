import { Test } from '@nestjs/testing';
import { GetDrillingProgramByIdHandler } from '../get-drilling-program-by-id.handler';
import { GetDrillingProgramByIdQuery } from '../../queries/get-drilling-program-by-id.query';
import type { IDrillingProgramRepository } from '../../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgram } from '../../../domain/entities/drilling-program.entity';
import { DrillingProgramStatus } from '../../../domain/enums/drilling-program-status.enum';

class StubRepo implements IDrillingProgramRepository {
  private item?: DrillingProgram;

  save(program: DrillingProgram): Promise<DrillingProgram> {
    this.item = program;
    return Promise.resolve(program);
  }

  findById(id: string): Promise<DrillingProgram | null> {
    return Promise.resolve(
      this.item && this.item.getId() === id ? this.item : null,
    );
  }

  findByOrganizationId(): Promise<DrillingProgram[]> {
    return Promise.resolve(this.item ? [this.item] : []);
  }

  findByWellId(): Promise<DrillingProgram[]> {
    return Promise.resolve(this.item ? [this.item] : []);
  }
}

describe(GetDrillingProgramByIdHandler.name, () => {
  it('returns dto for existing program', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GetDrillingProgramByIdHandler,
        { provide: 'DrillingProgramRepository', useClass: StubRepo },
      ],
    }).compile();

    const repo = moduleRef.get<IDrillingProgramRepository>(
      'DrillingProgramRepository',
    );
    const entity = new DrillingProgram({
      id: 'p1',
      organizationId: 'org',
      wellId: 'well',
      programName: 'DP',
      status: DrillingProgramStatus.DRAFT,
    });
    await repo.save(entity);

    const handler = moduleRef.get(GetDrillingProgramByIdHandler);
    const dto = await handler.execute(new GetDrillingProgramByIdQuery('p1'));
    expect(dto.id).toBe('p1');
    expect(dto.programName).toBe('DP');
  });
});
