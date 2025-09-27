import { Test, TestingModule } from '@nestjs/testing';

describe('LosExpenseAddedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<LosExpenseAddedEvent>(/* LosExpenseAddedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
