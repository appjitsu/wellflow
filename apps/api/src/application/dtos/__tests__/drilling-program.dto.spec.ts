import { Test, TestingModule } from '@nestjs/testing';

describe('DrillingProgramDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<DrillingProgramDto>(/* DrillingProgramDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
