import { Test, TestingModule } from '@nestjs/testing';

describe('JobsModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JobsModule>(/* JobsModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
