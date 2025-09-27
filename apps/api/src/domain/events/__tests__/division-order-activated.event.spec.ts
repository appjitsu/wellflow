import { Test, TestingModule } from '@nestjs/testing';

describe('DivisionOrderActivatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DivisionOrderActivatedEvent>(/* DivisionOrderActivatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
