import { Test, TestingModule } from '@nestjs/testing';

describe('daily-drilling-report.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<daily-drilling-report.repository.interface>(/* daily-drilling-report.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

