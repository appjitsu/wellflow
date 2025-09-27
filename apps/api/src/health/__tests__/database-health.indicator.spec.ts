import { Test, TestingModule } from '@nestjs/testing';

describe('DatabaseHealthIndicator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DatabaseHealthIndicator>(/* DatabaseHealthIndicator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
