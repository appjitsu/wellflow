import { Test, TestingModule } from '@nestjs/testing';

describe('DivisionOrderCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DivisionOrderCreatedEvent>(/* DivisionOrderCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
