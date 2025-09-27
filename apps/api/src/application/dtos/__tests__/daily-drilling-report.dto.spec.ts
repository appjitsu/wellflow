import { Test, TestingModule } from '@nestjs/testing';

describe('daily-drilling-report.dto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<daily-drilling-report.dto>(/* daily-drilling-report.dto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

