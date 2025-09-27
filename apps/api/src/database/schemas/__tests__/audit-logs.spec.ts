import { Test, TestingModule } from '@nestjs/testing';

describe('audit-logs', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<audit-logs>(/* audit-logs */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

