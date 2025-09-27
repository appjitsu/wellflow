import { Test, TestingModule } from '@nestjs/testing';

describe('ActiveWellsSpecification', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ActiveWellsSpecification>(/* ActiveWellsSpecification */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
