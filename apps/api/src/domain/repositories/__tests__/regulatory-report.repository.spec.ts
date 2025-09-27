import { Test, TestingModule } from '@nestjs/testing';

describe('regulatory-report.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulatory-report.repository>(/* regulatory-report.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

