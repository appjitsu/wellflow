import { Test, TestingModule } from '@nestjs/testing';

describe('job.types', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<job.types>(/* job.types */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
