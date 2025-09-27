import { Test, TestingModule } from '@nestjs/testing';

describe('daily-drilling-reports', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<daily-drilling-reports>(/* daily-drilling-reports */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

