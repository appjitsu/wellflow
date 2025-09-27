import { Test, TestingModule } from '@nestjs/testing';

describe('LosDistributedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<LosDistributedEvent>(/* LosDistributedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
