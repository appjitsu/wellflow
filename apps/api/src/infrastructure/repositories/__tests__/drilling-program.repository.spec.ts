import { Test, TestingModule } from '@nestjs/testing';

describe('DrillingProgramRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DrillingProgramRepository>(/* DrillingProgramRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
