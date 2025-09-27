import { Test, TestingModule } from '@nestjs/testing';

describe('WorkoverCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<WorkoverCreatedEvent>(/* WorkoverCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
