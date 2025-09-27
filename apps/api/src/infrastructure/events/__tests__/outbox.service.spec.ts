import { Test, TestingModule } from '@nestjs/testing';

describe('OutboxService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<OutboxService>(/* OutboxService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
