import { Test, TestingModule } from '@nestjs/testing';

describe('report-instance.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<report-instance.repository>(/* report-instance.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

